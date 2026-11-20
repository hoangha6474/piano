import {
  findLibraryScore,
  noStore,
  uuidPattern,
  withLibraryXML,
} from "@/server/library";
export const dynamic = "force-dynamic";
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!uuidPattern.test(id) || !process.env.DATABASE_URL)
    return Response.json(
      { error: "Không tìm thấy bản nhạc." },
      { status: 404, headers: noStore },
    );
  try {
    const row = await findLibraryScore(id);
    if (!row || row.status !== "published" || !row.publishedScore)
      return Response.json(
        { error: "Bản nhạc chưa xuất bản hoặc đã được ẩn." },
        { status: 404, headers: noStore },
      );
    return Response.json(
      await withLibraryXML(row.publishedScore, row.objectKey),
      { headers: noStore },
    );
  } catch {
    return Response.json(
      { error: "Không tải được sheet nhạc. Vui lòng thử lại." },
      { status: 503, headers: noStore },
    );
  }
}
