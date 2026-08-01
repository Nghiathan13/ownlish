import { defineConfig, devices } from "@playwright/test";

const WEB_PORT = 3100;
const API_PORT = 3101;
const WEB_BASE_URL = `http://localhost:${WEB_PORT}`;
const API_BASE_URL = `http://localhost:${API_PORT}`;
const E2E_DATABASE_URL =
  process.env.E2E_DATABASE_URL ??
  "postgresql://engvocab:engvocab@localhost:5434/engvocab_e2e";

export default defineConfig({
  testDir: "./e2e",
  testMatch: "**/*.e2e.ts",
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI
    ? [
        ["line"],
        ["html", { open: "never" }],
        ["json", { outputFile: "test-results/playwright.json" }],
      ]
    : "list",
  outputDir: "test-results",
  use: {
    baseURL: WEB_BASE_URL,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 900 },
      },
    },
  ],
  webServer: [
    {
      name: "api",
      cwd: "../engvocab-server",
      command:
        "pnpm prisma generate && pnpm prisma migrate deploy && pnpm build && pnpm start:prod",
      url: `${API_BASE_URL}/health`,
      reuseExistingServer: false,
      timeout: 180_000,
      env: {
        NODE_ENV: "test",
        DATABASE_URL: E2E_DATABASE_URL,
        JWT_SECRET: "playwright-e2e-jwt-secret-at-least-32-characters",
        PORT: String(API_PORT),
        CORS_ORIGIN: WEB_BASE_URL,
        BCRYPT_SALT_ROUNDS: "4",
        AUTH_RATE_LIMIT_LIMIT: "100",
        AUTH_RATE_LIMIT_TTL_SECONDS: "60",
        REFRESH_TOKEN_COOKIE_SECURE: "false",
        REFRESH_TOKEN_COOKIE_SAME_SITE: "lax",
        GOOGLE_CLIENT_ID: "",
        SUPABASE_URL: "",
        SUPABASE_SERVICE_ROLE_KEY: "",
      },
    },
    {
      name: "web",
      command: "pnpm build && pnpm start",
      url: WEB_BASE_URL,
      reuseExistingServer: false,
      timeout: 180_000,
      env: {
        PORT: String(WEB_PORT),
        NEXT_PUBLIC_API_BASE_URL: API_BASE_URL,
        AUTH_API_BASE_URL: API_BASE_URL,
        NEXT_PUBLIC_GOOGLE_CLIENT_ID: "",
      },
    },
  ],
});
