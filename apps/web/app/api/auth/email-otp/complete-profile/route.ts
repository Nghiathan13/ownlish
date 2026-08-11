import { handleCredentialAuth } from "@/_app/api-routes/auth/handleCredentialAuth";

export async function POST(request: Request) {
  return handleCredentialAuth(
    "/auth/email-otp/complete-profile",
    await request.text(),
  );
}
