import { handleLogoutAuth } from "@/_app/api-routes/auth/lib/handleLogoutAuth";

export async function POST() {
  return handleLogoutAuth();
}
