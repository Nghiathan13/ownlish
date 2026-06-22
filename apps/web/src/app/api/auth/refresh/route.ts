import { handleRefreshAuth } from "@/server/auth/handleRefreshAuth";

export async function POST() {
  return handleRefreshAuth();
}
