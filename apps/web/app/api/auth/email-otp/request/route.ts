import { handlePublicAuth } from "@/_app/api-routes/auth/lib/handleCredentialAuth";

export async function POST(request: Request) {
  return handlePublicAuth("/auth/email-otp/request", await request.text());
}
