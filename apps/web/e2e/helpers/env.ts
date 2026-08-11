/** Shared E2E environment defaults (aligned with playwright.config.ts). */
export const E2E_API_BASE_URL =
  process.env.E2E_API_BASE_URL ?? "http://localhost:3101";

export const REFRESH_TOKEN_COOKIE = "ownlish.refreshToken";

export const E2E_DEFAULT_USER_NAME = "E2E User";
