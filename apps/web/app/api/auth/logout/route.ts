import { handleLogoutAuth } from "@/_app/api-routes/auth/handleLogoutAuth";

export async function POST() {
  return handleLogoutAuth();
}
