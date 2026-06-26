import { handleCredentialAuth } from "@/server/auth/handleCredentialAuth";

export async function POST(request: Request) {
  const body = await request.text();
  return handleCredentialAuth("/auth/google", body);
}
