export const REFRESH_COOKIE_NAME = "engvocab.refreshToken";

export const REFRESH_COOKIE_PATH = "/api/auth";

export const REFRESH_COOKIE_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

export function getAuthApiBaseUrl(): string {
  return (
    process.env.AUTH_API_BASE_URL ??
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    "http://localhost:3001"
  );
}
