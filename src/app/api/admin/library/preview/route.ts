import { requireAdmin } from "@/server/admin";
import { readLimited } from "@/server/http";
import { noStore } from "@/server/library";
import { MAX_MUSICXML_BYTES, readMusicXML } from "@/music/musicxml";
export async function POST(request: Request) {
  const admin = await requireAdmin(request);
  if (admin instanceof Response) return admin;
  let xml: string;
  try {
    xml = new TextDecoder("utf-8", { fatal: true }).decode(
      await readLimited(request, MAX_MUSICXML_BYTES),
    );
  } catch {
    return Response.json(
      { error: "Tệp cần là MusicXML UTF-8, tối đa 5 MB." },
      { status: 413 },
    );
  }
  try {
    return Response.json(readMusicXML(xml, "preview"), { headers: noStore });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "MusicXML không hợp lệ.",
      },
      { status: 400, headers: noStore },
    );
  }
}
