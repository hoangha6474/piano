import "server-only";
export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin"),
    expected = process.env.BETTER_AUTH_URL;
  return !!origin && !!expected && origin === new URL(expected).origin;
}
export function unavailable(message = "Dịch vụ chưa được cấu hình.") {
  return Response.json({ error: message }, { status: 503 });
}
export async function readLimited(request: Request, max: number) {
  const reader = request.body?.getReader();
  if (!reader) return new Uint8Array();
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > max) {
      await reader.cancel();
      throw new Error("PAYLOAD_TOO_LARGE");
    }
    chunks.push(value);
  }
  const output = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    output.set(chunk, offset);
    offset += chunk.length;
  }
  return output;
}
