import { GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { and, eq, desc } from "drizzle-orm";
import { currentUser } from "@/server/auth";
import { getDb } from "@/server/db";
import { assets } from "@/server/db/schema";
import { getStorage, storageReady } from "@/server/storage";
import { sameOrigin, unavailable } from "@/server/http";
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
export async function POST() {
  return Response.json(
    {
      error:
        "Không hỗ trợ tải bản nhạc riêng. Vui lòng sử dụng thư viện hệ thống.",
    },
    { status: 403 },
  );
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
