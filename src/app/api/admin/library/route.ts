import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { desc } from "drizzle-orm";
import { requireAdmin } from "@/server/admin";
import { getDb } from "@/server/db";
import { libraryScores } from "@/server/db/schema";
import { readLimited, unavailable } from "@/server/http";
import { adminItem, noStore } from "@/server/library";
import {
  applyLibraryMetadata,
  createLibraryScore,
} from "@/server/library-validation";
import { getStorage, storageReady } from "@/server/storage";
import { readMusicXML } from "@/music/musicxml";
export const dynamic = "force-dynamic";
export async function GET() {
  const admin = await requireAdmin();
  if (admin instanceof Response) return admin;
  try {
    const rows = await getDb()
      .select()
      .from(libraryScores)
      .orderBy(desc(libraryScores.updatedAt));
    return Response.json(rows.map(adminItem), { headers: noStore });
  } catch {
    return unavailable(
      "Không đọc được thư viện quản trị. Kiểm tra cấu hình và migration.",
    );
  }
}
export async function POST(request: Request) {
  const admin = await requireAdmin(request);
  if (admin instanceof Response) return admin;
  if (!storageReady())
    return unavailable("Chưa cấu hình Cloudflare R2 để lưu sheet nhạc.");
  let raw: Uint8Array;
  try {
    raw = await readLimited(request, 6 * 1024 * 1024);
  } catch {
    return Response.json(
      { error: "Yêu cầu vượt giới hạn 6 MB." },
      { status: 413 },
    );
  }
  let input, score;
  const id = crypto.randomUUID();
  try {
    input = createLibraryScore.parse(JSON.parse(new TextDecoder().decode(raw)));
    score = applyLibraryMetadata(readMusicXML(input.xml, id), input.metadata);
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error && !("issues" in error)
            ? error.message
            : "Kiểm tra tên bài, tác giả, cấp độ, tempo và quyền sử dụng.",
      },
      { status: 400 },
    );
  }
  const objectKey = `library/${id}/${crypto.randomUUID()}.musicxml`;
  const storage = getStorage();
  let uploaded = false;
  try {
    await storage.send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET,
        Key: objectKey,
        Body: score.xml,
        ContentType: "application/vnd.recordare.musicxml+xml",
      }),
    );
    uploaded = true;
    const { xml: _xml, ...data } = score;
    const [row] = await getDb()
      .insert(libraryScores)
      .values({
        id,
        score: data,
        objectKey,
        createdBy: admin.id,
        updatedBy: admin.id,
      })
      .returning();
    return Response.json(
      { ...adminItem(row), score },
      { status: 201, headers: noStore },
    );
  } catch {
    if (uploaded)
      await storage
        .send(
          new DeleteObjectCommand({
            Bucket: process.env.R2_BUCKET,
            Key: objectKey,
          }),
        )
        .catch(() => {});
    return unavailable(
      "Không lưu được bản nháp. Kiểm tra R2 và migration database.",
    );
  }
}
