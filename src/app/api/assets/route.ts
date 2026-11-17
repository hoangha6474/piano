import {
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createHash, randomUUID } from "node:crypto";
import { XMLValidator } from "fast-xml-parser";
import { Midi } from "@tonejs/midi";
import { and, eq, desc } from "drizzle-orm";
import { currentUser } from "@/server/auth";
import { getDb } from "@/server/db";
import { assets } from "@/server/db/schema";
import { getStorage, storageReady } from "@/server/storage";
import { readLimited, sameOrigin, unavailable } from "@/server/http";
export const runtime = "nodejs";
export async function GET(request: Request) {
  const user = await currentUser();
  if (!user) return Response.json({ error: "Cần đăng nhập." }, { status: 401 });
  if (!storageReady()) return unavailable("Chưa cấu hình Cloudflare R2.");
  const id = new URL(request.url).searchParams.get("id");
  if (!id)
    return Response.json(
      await getDb()
        .select({
          id: assets.id,
          mime: assets.mime,
          bytes: assets.bytes,
          createdAt: assets.createdAt,
        })
        .from(assets)
        .where(eq(assets.userId, user.id))
        .orderBy(desc(assets.createdAt))
        .limit(100),
    );
  if (!/^[a-f0-9-]{36}$/i.test(id))
    return Response.json({ error: "Không tìm thấy tệp." }, { status: 404 });
  const [asset] = await getDb()
    .select()
    .from(assets)
    .where(and(eq(assets.id, id), eq(assets.userId, user.id)));
  if (!asset)
    return Response.json({ error: "Không tìm thấy tệp." }, { status: 404 });
  const url = await getSignedUrl(
    getStorage(),
    new GetObjectCommand({
      Bucket: process.env.R2_BUCKET,
      Key: asset.objectKey,
      ResponseContentDisposition: "attachment",
    }),
    { expiresIn: 60 },
  );
  return Response.json({ url }, { headers: { "Cache-Control": "no-store" } });
}
export async function POST(request: Request) {
  if (!sameOrigin(request))
    return Response.json(
      { error: "Nguồn yêu cầu không hợp lệ." },
      { status: 403 },
    );
  const user = await currentUser();
  if (!user) return Response.json({ error: "Cần đăng nhập." }, { status: 401 });
  if (!storageReady()) return unavailable("Chưa cấu hình Cloudflare R2.");
  let bytes: Uint8Array;
  try {
    bytes = await readLimited(request, 5 * 1024 * 1024);
  } catch {
    return Response.json({ error: "Tệp vượt 5 MB." }, { status: 413 });
  }
  if (!bytes.length)
    return Response.json({ error: "Tệp rỗng." }, { status: 400 });
  let mime: string, extension: string;
  try {
    if (String.fromCharCode(...bytes.slice(0, 4)) === "MThd") {
      const midi = new Midi(bytes);
      if (
        !midi.tracks.some((t) => t.notes.length) ||
        midi.tracks.reduce((s, t) => s + t.notes.length, 0) > 20000
      )
        throw new Error();
      mime = "audio/midi";
      extension = "mid";
    } else {
      const xml = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
      if (
        /<!DOCTYPE|<!ENTITY/i.test(xml) ||
        !/<score-partwise[\s>]/.test(xml) ||
        XMLValidator.validate(xml) !== true ||
        (xml.match(/<note[\s>]/g) || []).length > 20000
      )
        throw new Error();
      mime = "application/vnd.recordare.musicxml+xml";
      extension = "musicxml";
    }
  } catch {
    return Response.json(
      { error: "MIDI hoặc MusicXML không hợp lệ. DTD/entity không được phép." },
      { status: 400 },
    );
  }
  const key = `private/${user.id}/${randomUUID()}.${extension}`,
    storage = getStorage();
  try {
    await storage.send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET,
        Key: key,
        Body: bytes,
        ContentType: mime,
      }),
    );
    const [asset] = await getDb()
      .insert(assets)
      .values({
        userId: user.id,
        objectKey: key,
        mime,
        bytes: bytes.length,
        sha256: createHash("sha256").update(bytes).digest("hex"),
      })
      .returning({ id: assets.id });
    return Response.json(asset, { status: 201 });
  } catch {
    await storage
      .send(
        new DeleteObjectCommand({ Bucket: process.env.R2_BUCKET, Key: key }),
      )
      .catch(() => {});
    return unavailable("Không lưu được tệp. Vui lòng thử lại.");
  }
}
export async function DELETE(request: Request) {
  if (!sameOrigin(request))
    return Response.json(
      { error: "Nguồn yêu cầu không hợp lệ." },
      { status: 403 },
    );
  const user = await currentUser();
  if (!user) return Response.json({ error: "Cần đăng nhập." }, { status: 401 });
  if (!storageReady()) return unavailable();
  const id = new URL(request.url).searchParams.get("id");
  if (!id || !/^[a-f0-9-]{36}$/i.test(id))
    return Response.json({ error: "Không tìm thấy tệp." }, { status: 404 });
  const [asset] = await getDb()
    .select()
    .from(assets)
    .where(and(eq(assets.id, id), eq(assets.userId, user.id)));
  if (!asset)
    return Response.json({ error: "Không tìm thấy tệp." }, { status: 404 });
  await getStorage().send(
    new DeleteObjectCommand({
      Bucket: process.env.R2_BUCKET,
      Key: asset.objectKey,
    }),
  );
  await getDb()
    .delete(assets)
    .where(and(eq(assets.id, id), eq(assets.userId, user.id)));
  return Response.json({ deleted: true });
}
