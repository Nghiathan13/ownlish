# Ownlish API

NestJS API for authentication, vocabulary review, TOEIC sessions, Dictation
progress and learning activity. It uses Prisma/PostgreSQL and Cloudflare R2 for
public assets.

See [ARCHITECTURE.md](ARCHITECTURE.md) for server code structure, feature-layer
boundaries, migration rules, and test policy.

## Local development

From the repository root:

```bash
pnpm install --frozen-lockfile
cp apps/server/.env.example apps/server/.env.local
pnpm --filter ownlish-server prisma generate
pnpm --filter ownlish-server prisma migrate deploy
pnpm dev:server
```

Start the local PostgreSQL service with:

```bash
docker compose -f apps/server/docker-compose.yml up -d
```

### Email OTP mailer

| `EMAIL_MAILER` | Behavior |
| --- | --- |
| `resend` (default) | Sends codes through Resend (`RESEND_API_KEY` required) |
| `outbox` | Stores codes in process memory (E2E / local without Resend). Exposes `GET /auth/test/email-outbox/latest?email=` only when `NODE_ENV` is not `production`. |

Playwright and Nest e2e set `EMAIL_MAILER=outbox` and a test `EMAIL_OTP_PEPPER`.
## Storage

R2 is S3-compatible. The API needs R2 credentials only for avatar writes;
TOEIC and Dictation catalogs are published from local final content and served
through the public `content` custom domains.

```bash
# Build and publish TOEIC from ownlish/content/toeic
pnpm --filter ownlish-server toeic:publish -- \
  --source ../../content/toeic \
  --prefix toeic

# Configure browser media CORS once per bucket with a token scoped to that bucket
pnpm --filter ownlish-server storage:configure-cors -- \
  --bucket ownlish-content-staging

# Inspect an R2 prefix without changing it
pnpm --filter ownlish-server storage:manifest -- \
  --bucket ownlish-content-staging --prefix toeic

# After the Dictation catalog is published, validate and project approved
# transcripts into PostgreSQL before releasing the client that submits answers.
pnpm --filter ownlish-server dictation:sync-catalog
```

`storage:migrate-supabase` is an idempotent copy tool for the existing
Supabase Storage buckets. Run it with `--dry-run` first; it never deletes the
source or target objects.

## Production

Production is deployed from the repository root by GitHub Actions. The VPS
contains environment files under `/opt/ownlish/env` and runs isolated staging
and production Compose projects behind Caddy. See the root [README](../../README.md)
for deployment, backups and cutover procedures.

## Quality checks

```bash
pnpm --filter ownlish-server lint:check
pnpm --filter ownlish-server test
pnpm --filter ownlish-server test:e2e
pnpm --filter ownlish-server build
```
