import { handleCredentialAuth } from "@/_app/api-routes/auth/handleCredentialAuth";

export async function POST(request: Request) {
  const body = await request.text();

  return handleCredentialAuth("/auth/register", body);
}
