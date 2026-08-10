import { handleCredentialAuth } from "@/server/auth/handleCredentialAuth";

export async function POST(request: Request) {
  return handleCredentialAuth(
    "/auth/email-otp/complete-profile",
    await request.text(),
  );
}
