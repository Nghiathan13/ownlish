import { handleRefreshAuth } from "@/_app/api-routes/auth/lib/handleRefreshAuth";

export async function POST() {
  return handleRefreshAuth();
}
