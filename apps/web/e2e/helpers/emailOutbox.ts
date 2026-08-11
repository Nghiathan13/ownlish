import { expect, request } from "@playwright/test";
import { E2E_API_BASE_URL } from "./env";

type LatestLoginCodeResponse = {
  email: string;
  code: string;
  idempotencyKey: string;
  sentAt: string;
};

/** Poll the API test outbox for the latest OTP (requires EMAIL_MAILER=outbox). */
export async function getLatestLoginCode(email: string): Promise<string> {
  const api = await request.newContext({ baseURL: E2E_API_BASE_URL });

  try {
    await expect
      .poll(
        async () => {
          const response = await api.get("/auth/test/email-outbox/latest", {
            params: { email },
          });
          return response.status();
        },
        {
          message: `Timed out waiting for login code outbox entry for ${email}`,
          timeout: 10_000,
        },
      )
      .toBe(200);

    const response = await api.get("/auth/test/email-outbox/latest", {
      params: { email },
    });
    const body = (await response.json()) as LatestLoginCodeResponse;

    expect(body.code).toMatch(/^\d{6}$/);
    return body.code;
  } finally {
    await api.dispose();
  }
}
