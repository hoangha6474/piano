import "server-only";
import { currentUser } from "./auth";
import { isAdminId } from "./admin-policy";
import { sameOrigin } from "./http";

export async function requireAdmin(request?: Request) {
  if (request && !sameOrigin(request))
    return Response.json(
      { error: "Nguồn yêu cầu không hợp lệ." },
      { status: 403 },
    );
  const user = await currentUser();
  if (!user)
    return Response.json(
      { error: "Đăng nhập bằng tài khoản quản trị để tiếp tục." },
      { status: 401 },
    );
  if (!isAdminId(user.id))
    return Response.json(
      { error: "Tài khoản này không có quyền quản trị thư viện." },
      { status: 403 },
    );
  return user;
}
