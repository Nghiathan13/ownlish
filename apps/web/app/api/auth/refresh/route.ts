import { handleRefreshAuth } from "@/_app/api-routes/auth/handleRefreshAuth";

export async function POST() {
  return handleRefreshAuth();
}
