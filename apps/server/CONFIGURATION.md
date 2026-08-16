# Ownlish API configuration

This document defines configuration for `apps/server`. The runtime source of
truth is `src/config/env.ts`; [`.env.example`](.env.example) is the local
template and also lists variables used by operational scripts.

## Local configuration and precedence

Create an untracked local file before running the API or Prisma commands:

```bash
cp .env.example .env.local
```

`src/config/load-env.ts` loads `.env.local` before the legacy `.env` file.
Already-provided process environment values win, so Docker Compose and CI can
inject their own configuration without being overwritten. Never commit either
local environment file.

## Runtime variables

| Group | Variables | Notes |
| --- | --- | --- |
| Required core | `DATABASE_URL`, `JWT_SECRET` | `JWT_SECRET` must contain at least 32 characters. |
| Network | `NODE_ENV`, `PORT`, `CORS_ORIGIN` | Defaults are development, `3001`, and `http://localhost:3000`. |
| Token and password policy | `ACCESS_TOKEN_TTL_SECONDS`, `BCRYPT_SALT_ROUNDS`, `REFRESH_TOKEN_TTL_DAYS` | Positive integers; defaults are `900`, `10`, and `30`. |
| Refresh cookie | `REFRESH_TOKEN_COOKIE_NAME`, `REFRESH_TOKEN_COOKIE_SECURE`, `REFRESH_TOKEN_COOKIE_SAME_SITE` | `secure` defaults to true in production; same-site defaults accordingly. |
| Rate limit | `AUTH_RATE_LIMIT_LIMIT`, `AUTH_RATE_LIMIT_TTL_SECONDS` | Positive integers; defaults are `10` and `60`. |
| Google OAuth | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI` | Configure all three only when Google sign-in is enabled. |
| Email OTP | `EMAIL_MAILER`, `RESEND_API_KEY`, `EMAIL_FROM`, `EMAIL_OTP_PEPPER` | `EMAIL_MAILER` is `resend` or test-only `outbox`. Keep the Resend key and pepper secret. |
| Learning content | `TOEIC_GRADING_INDEX_URL`, `DICTATION_CATALOG_ROOT` | Public, environment-specific content URLs used by API grading/catalog sync. |
| Avatar storage | `R2_ENDPOINT`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_ASSETS_BUCKET`, `PUBLIC_ASSETS_ROOT` | Required when avatar storage is enabled; all credentials stay server-side. |
| Observability | `OTEL_ENABLED`, `OTEL_EXPORTER_OTLP_ENDPOINT`, `OTEL_EXPORTER_OTLP_HEADERS`, `OTEL_SERVICE_NAME` | When OTEL is enabled, endpoint and headers are required. |

## Script-only variables

These values are not general API runtime configuration but are needed by the
matching operational command in [`scripts/README.md`](scripts/README.md):

| Variables | Consumer |
| --- | --- |
| `R2_CONTENT_BUCKET` plus R2 credentials | TOEIC publishing and content-bucket CORS configuration. |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` plus R2 credentials | One-time `storage:migrate-supabase` migration. |
| `PERFORMANCE_VUS`, `PERFORMANCE_EMAIL_PREFIX`, `PERFORMANCE_PASSWORD`, `PERFORMANCE_DATABASE_URL` | Local performance fixtures and load checks. |

Use a protected shell for migration or publishing credentials. A dry run is
required before the Supabase storage migration.

## Environment relationships

- The API's `CORS_ORIGIN` must equal the browser origin served by Web.
- `GOOGLE_CLIENT_ID` must match Web's `NEXT_PUBLIC_GOOGLE_CLIENT_ID`; the API
  alone stores `GOOGLE_CLIENT_SECRET`.
- `DICTATION_CATALOG_ROOT` must point at the published catalog for the same
  environment. Run `pnpm dictation:sync-catalog` there after migration and
  catalog publication, before releasing Dictation submissions.
- `PUBLIC_ASSETS_ROOT` and `R2_ASSETS_BUCKET` must describe the same R2
  environment.

## Deployed configuration

Staging and production environment files live outside Git at
`/opt/ownlish/env/<environment>.env`. They are passed to the isolated Compose
project by the deployment script. See
[`../../infra/OPERATIONS.md`](../../infra/OPERATIONS.md) for deployment,
backup, and cutover procedures.
