import { handlePublicAuth } from "@/server/auth/handleCredentialAuth";

export async function POST(request: Request) {
  return handlePublicAuth("/auth/email-otp/request", await request.text());
}
