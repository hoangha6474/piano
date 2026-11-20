import { and, eq } from "drizzle-orm";
import { requireAdmin } from "@/server/admin";
import { getDb } from "@/server/db";
import { libraryScores } from "@/server/db/schema";
import { readLimited, unavailable } from "@/server/http";
import {
  adminItem,
  findLibraryScore,
  noStore,
  uuidPattern,
  withLibraryXML,
} from "@/server/library";
import {
  applyLibraryMetadata,
  changeLibraryScore,
} from "@/server/library-validation";
type Context = { params: Promise<{ id: string }> };
export async function GET(_request: Request, { params }: Context) {
  const admin = await requireAdmin();
  if (admin instanceof Response) return admin;
  const { id } = await params;
  if (!uuidPattern.test(id))
    return Response.json(
      { error: "Không tìm thấy bản nhạc." },
      { status: 404 },
    );
  try {
    const row = await findLibraryScore(id);
    if (!row)
      return Response.json(
        { error: "Không tìm thấy bản nhạc." },
        { status: 404 },
      );
    return Response.json(
      {
        ...adminItem(row),
        score: await withLibraryXML(row.score, row.objectKey),
      },
      { headers: noStore },
    );
  } catch {
    return unavailable("Không tải được bản nháp. Vui lòng thử lại.");
  }
}
export async function PATCH(request: Request, { params }: Context) {
  const admin = await requireAdmin(request);
  if (admin instanceof Response) return admin;
  const { id } = await params;
  if (!uuidPattern.test(id))
    return Response.json(
      { error: "Không tìm thấy bản nhạc." },
      { status: 404 },
    );
  let raw: Uint8Array;
  try {
    raw = await readLimited(request, 16 * 1024);
  } catch {
    return Response.json({ error: "Yêu cầu vượt giới hạn." }, { status: 413 });
  }
  let input;
  try {
    input = changeLibraryScore.parse(JSON.parse(new TextDecoder().decode(raw)));
  } catch {
    return Response.json(
      { error: "Thông tin cập nhật không hợp lệ." },
      { status: 400 },
    );
  }
  try {
    const row = await findLibraryScore(id);
    if (!row)
      return Response.json(
        { error: "Không tìm thấy bản nhạc." },
        { status: 404 },
      );
    if (row.revision !== input.revision)
      return Response.json(
        {
          error:
            "Bản nhạc đã được cập nhật ở nơi khác. Hãy mở lại trước khi sửa.",
        },
        { status: 409 },
      );
    const next = input.revision + 1;
    const patch: Partial<typeof libraryScores.$inferInsert> = {
      revision: next,
      updatedBy: admin.id,
      updatedAt: new Date(),
    };
    if (input.action === "save")
      patch.score = applyLibraryMetadata(row.score, input.metadata);
    if (input.action === "publish") {
      // Verify that the original still exists before exposing the published version.
      await withLibraryXML(row.score, row.objectKey);
      patch.status = "published";
      patch.publishedScore = row.score;
      patch.publishedRevision = next;
    }
    if (input.action === "hide") patch.status = "hidden";
    const [updated] = await getDb()
      .update(libraryScores)
      .set(patch)
      .where(
        and(
          eq(libraryScores.id, id),
          eq(libraryScores.revision, input.revision),
        ),
      )
      .returning();
    if (!updated)
      return Response.json(
        { error: "Có thay đổi đồng thời. Hãy mở lại bản nhạc." },
        { status: 409 },
      );
    return Response.json(adminItem(updated), { headers: noStore });
  } catch {
    return unavailable(
      "Không cập nhật được bản nhạc. Kiểm tra kết nối, sheet gốc và tempo.",
    );
  }
}
