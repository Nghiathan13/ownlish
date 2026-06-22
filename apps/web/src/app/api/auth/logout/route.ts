import { handleLogoutAuth } from "@/server/auth/handleLogoutAuth";

export async function POST() {
  return handleLogoutAuth();
}
