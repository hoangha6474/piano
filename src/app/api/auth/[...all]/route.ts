import { getAuth, authReady } from "@/server/auth";
import { unavailable } from "@/server/http";
export const runtime = "nodejs";
async function handler(request: Request) {
  if (!authReady()) return unavailable("Chưa cấu hình Neon và Better Auth.");
  return getAuth().handler(request);
}
export { handler as GET, handler as POST };
