import { noStore, publishedLibrary } from "@/server/library";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    return Response.json(await publishedLibrary(), { headers: noStore });
  } catch {
    return Response.json(
      { error: "Chưa tải được thư viện cập nhật. Vui lòng thử lại." },
      { status: 503, headers: noStore },
    );
  }
}
