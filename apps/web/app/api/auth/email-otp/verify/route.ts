import { handleCredentialAuth } from "@/_app/api-routes/auth/lib/handleCredentialAuth";

export async function POST(request: Request) {
  return handleCredentialAuth("/auth/email-otp/verify", await request.text());
}
