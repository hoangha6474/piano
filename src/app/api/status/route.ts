import { isAdminId } from "@/server/admin-policy";
import { authReady, currentUser } from "@/server/auth";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    const user = await currentUser();
    return Response.json({
      admin: isAdminId(user?.id),
      auth: authReady(),
      storage: !!(
        process.env.R2_ACCOUNT_ID &&
        process.env.R2_ACCESS_KEY_ID &&
        process.env.R2_SECRET_ACCESS_KEY &&
        process.env.R2_BUCKET
      ),
      ai: !!(
        process.env.AI_MODEL &&
        ((process.env.AI_PROVIDER === "openai" && process.env.OPENAI_API_KEY) ||
          (process.env.AI_PROVIDER === "gemini" && process.env.GEMINI_API_KEY))
      ),
      user,
    });
  } catch {
    return Response.json(
      {
        admin: false,
        auth: false,
        storage: false,
        ai: false,
        user: null,
        error:
          "Không kết nối được dịch vụ tài khoản. Kiểm tra cấu hình và migration.",
      },
      { status: 503 },
    );
  }
}
