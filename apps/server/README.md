# EngVocab Server

NestJS API server for EngVocab. It powers authentication (email + Google),
spaced-repetition vocabulary practice, curated word collections, and full
TOEIC practice/mock-test taking for the web client.

## Stack

- NestJS 11 (Express, Helmet, class-validator/global `ValidationPipe`)
- PostgreSQL 16 + Prisma 7
- JWT access tokens + rotating, hashed, revocable refresh sessions (HttpOnly cookie)
- Google Sign-In (ID token verification via `google-auth-library`)
- `@nestjs/throttler` rate limiting on auth endpoints
- Supabase Postgres (production DB) + Supabase Storage (TOEIC audio/image media)
- Docker Compose for local PostgreSQL
- Jest + Supertest for unit and e2e tests
- GitHub Actions CI

## Requirements

- Node.js 22
- pnpm (via Corepack)
- Docker (for local PostgreSQL)

## Local Setup

Install dependencies:

```bash
pnpm install
```

Create local env:

```bash
cp .env.example .env
```

Start PostgreSQL:

```bash
docker compose up -d
```

Generate the Prisma client and apply migrations:

```bash
pnpm prisma generate
pnpm prisma migrate deploy
```

Start the API:

```bash
pnpm start:dev
```

The server runs on `http://localhost:3001` by default.

Google login and Supabase Storage are optional locally: leave `GOOGLE_CLIENT_ID`
empty to disable Google login, and leave `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY`
empty to skip TOEIC media signing/upload (the server logs a warning and continues).

## TOEIC Catalog

Generate the current catalog from the authoring JSON files:

```bash
pnpm toeic:catalog -- --source /path/to/toeic --out /tmp/toeic-catalog
```

Preview every object that would be uploaded to the existing public `toeic`
bucket:

```bash
pnpm toeic:publish -- --source /path/to/toeic --dry-run
```

Publish the catalog, its part documents, and `grading-index.json`:

```bash
pnpm toeic:publish -- --source /path/to/toeic
```

The script uploads part documents before `catalog.json`, so the manifest only
becomes visible after its referenced files are present. It does not upload media
files or create the bucket.

## Environment Variables

| Name | Required | Default | Purpose |
| --- | --- | --- | --- |
| `DATABASE_URL` | Yes | - | PostgreSQL connection string |
| `JWT_SECRET` | Yes | - | Secret used to sign access tokens. Must be at least 32 characters |
| `PORT` | No | `3001` | API server port |
| `CORS_ORIGIN` | No | `http://localhost:3000` | Allowed frontend origin |
| `GOOGLE_CLIENT_ID` | No | - | Google OAuth web client ID. Must match the web client's `NEXT_PUBLIC_GOOGLE_CLIENT_ID`. When empty, `POST /auth/google` is disabled |
| `ACCESS_TOKEN_TTL_SECONDS` | No | `900` | Access token lifetime in seconds |
| `BCRYPT_SALT_ROUNDS` | No | `10` | Password hashing cost |
| `REFRESH_TOKEN_TTL_DAYS` | No | `30` | Refresh token lifetime in days |
| `REFRESH_TOKEN_COOKIE_NAME` | No | `engvocab.refreshToken` | HttpOnly refresh token cookie name. Must stay `engvocab.refreshToken` to match the web client's BFF |
| `REFRESH_TOKEN_COOKIE_SECURE` | No | `true` in production, otherwise `false` | Whether the refresh cookie requires HTTPS |
| `REFRESH_TOKEN_COOKIE_SAME_SITE` | No | `none` when secure, otherwise `lax` | Refresh cookie SameSite policy: `lax`, `none`, or `strict` |
| `AUTH_RATE_LIMIT_LIMIT` | No | `10` | Request limit for auth endpoints |
| `AUTH_RATE_LIMIT_TTL_SECONDS` | No | `60` | Rate limit window for auth endpoints |
| `SUPABASE_URL` | No | - | Supabase project URL. When empty, TOEIC media signing/upload is disabled |
| `SUPABASE_SERVICE_ROLE_KEY` | No | - | Supabase service role key used for Storage |
| `TOEIC_STORAGE_BUCKET` | No | `toeic-media` | Supabase Storage bucket for TOEIC audio/images |
| `TOEIC_SIGNED_URL_TTL_SECONDS` | No | `900` | Lifetime of signed TOEIC media URLs |
| `TOEIC_GRADING_INDEX_URL` | Runtime API only | - | Public URL of the current `grading-index.json` in Storage |

`NODE_ENV` is also read: when it equals `production`, the refresh cookie defaults
to `Secure` unless `REFRESH_TOKEN_COOKIE_SECURE` overrides it.

## Modules

| Module | Path | Responsibility |
| --- | --- | --- |
| App | `src/app` | Root module, `GET /health` |
| Auth | `src/auth` | Register/login/Google/refresh/logout, JWT guard, admin guard, refresh sessions |
| Users | `src/users` | User lookups (used by auth + admin guard) |
| Vocab | `src/vocab` | User vocabulary + definitions, SRS review, stats |
| Collections | `src/collections` | User + system word collections, catalog import |
| Tests | `src/tests` | TOEIC test catalog, full runs (practice/mock), part practice, media signing |
| Admin | `src/admin` | Admin-only TOEIC content management (groups, questions, media uploads) |
| Prisma | `src/prisma` | Prisma client wrapper |
| Config | `src/config` | Typed env loading + validation |

## API Overview

All endpoints except `/health` are JSON. Vocabulary, collection, test, and admin
endpoints require `Authorization: Bearer <accessToken>`. Auth refresh tokens are
stored in an HttpOnly cookie scoped to `/auth`.

Health:

- `GET /health`

Auth (rate-limited; `register`/`login`/`google`/`refresh` set the refresh cookie, `logout` clears it):

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/google`
- `POST /auth/refresh`
- `POST /auth/logout`
- `GET /auth/me` (JWT)

Vocabulary (JWT):

- `GET /vocab` — query: `collectionId` (required), `search`, `limit` (1-500), `offset`
- `GET /vocab/stats` — query: `collectionId` (required)
- `GET /vocab/review/due` — query: `collectionId` (required), `limit` (1-1000), `offset`
- `GET /vocab/:id`
- `POST /vocab`
- `PATCH /vocab/:id`
- `PATCH /vocab/:id/review`
- `DELETE /vocab/definitions/:id`
- `DELETE /vocab/:id`

Collections (JWT):

- `GET /collections`
- `POST /collections`
- `GET /collections/:id`
- `POST /collections/:id/import` — body: `targetCollectionId?`, `catalogDefinitionIds?`
- `PATCH /collections/:id`
- `DELETE /collections/:id`

Tests (JWT):

- `GET /tests/years`
- `GET /tests` — query: `year` (default `2026`)
- `GET /tests/part-practice/parts`
- `POST /tests/part-practice/runs`
- `GET /tests/part-practice/runs/:sessionId`
- `POST /tests/part-practice/runs/:sessionId/answers`
- `DELETE /tests/part-practice/:partNumber/history`
- `POST /tests/runs` — create a full TOEIC run (practice or mock-test mode)
- `GET /tests/runs/:sessionId`
- `POST /tests/runs/:sessionId/expand-parts`
- `POST /tests/runs/:sessionId/answers`
- `PATCH /tests/runs/:sessionId/finish`
- `DELETE /tests/:testId/practice-history`
- `POST /tests/:testId/parts/:partNumber/refresh-media`

Admin (JWT + `ADMIN` role, under `/admin/tests`):

- `GET /admin/tests`
- `GET /admin/tests/:testId/raw`
- `PATCH /admin/tests/groups/:groupId`
- `POST /admin/tests/groups/:groupId/audio` — multipart `audio`, max 5 MB
- `DELETE /admin/tests/groups/:groupId/audio`
- `POST /admin/tests/groups/:groupId/image` — multipart `image`, max 5 MB
- `DELETE /admin/tests/groups/:groupId/image`
- `PATCH /admin/tests/questions/:questionId`

The Next.js web client proxies auth through a same-origin BFF (`/api/auth/*`)
that extracts the upstream refresh cookie and re-sets it on the web origin, so
the backend refresh cookie is consumed by the BFF rather than the browser
directly. Keep `REFRESH_TOKEN_COOKIE_NAME` as `engvocab.refreshToken` because
that is the upstream cookie name the BFF expects, and set `CORS_ORIGIN` to the
exact web origin (the browser calls the API directly with a Bearer token for
non-auth data). For direct cross-domain cookie usage, use
`REFRESH_TOKEN_COOKIE_SECURE=true` and `REFRESH_TOKEN_COOKIE_SAME_SITE=none`.

## Admin Access

The `AdminGuard` requires the authenticated user's `role` to be `ADMIN`. There is
no public endpoint that grants admin; set it directly on the user row, for example
against Supabase/Postgres:

```sql
UPDATE users SET role = 'ADMIN' WHERE email = 'you@example.com';
```

`package.json` also defines an `admin:grant` script (`ts-node scripts/grant-admin.ts`),
but the script file is not currently committed, so grant admin via SQL until it is added.

## TOEIC Media & Supabase Storage

TOEIC audio and images are stored in Supabase Storage (`TOEIC_STORAGE_BUCKET`).
The `TestsStorageService` creates signed URLs (TTL `TOEIC_SIGNED_URL_TTL_SECONDS`)
for playback, and the admin upload endpoints write/delete objects. If Supabase is
not configured, media fields are returned without signed URLs and admin uploads fail
fast with a clear error.

## Checks

```bash
pnpm test          # unit tests (Jest)
pnpm test:e2e      # e2e tests (Supertest, needs DATABASE_URL)
pnpm test:cov      # unit tests with coverage
pnpm build
pnpm lint
pnpm format
```

## CI

`.github/workflows/ci.yml` runs on pull requests and pushes to `main`. It starts a
Postgres 16 service, installs with `pnpm install --frozen-lockfile`, generates the
Prisma client, runs `migrate deploy`, then runs unit tests, e2e tests, and the build.

## Production Deployment

Recommended production architecture:

```txt
Vercel web client -> Railway NestJS API -> Supabase Postgres
                                            Supabase Storage (TOEIC media)
```

### Supabase database

Use Supabase as the production PostgreSQL database. Apply Prisma migrations
before pointing production traffic at the API:

```bash
pnpm prisma migrate deploy
```

Then import the Oxford catalog data once. The catalog lives separately from user
vocabulary; importing a collection into a user's vocabulary skips words the user
already has.

Use a production-only connection string in Railway. Do not commit production
connection strings or `.env.production.local`.

With Supabase Session Pooler, Railway may need `sslmode=no-verify` if Node.js
reports a self-signed certificate chain:

```env
DATABASE_URL="postgres://prisma.<project-ref>:<password>@<region>.pooler.supabase.com:5432/postgres?sslmode=no-verify"
```

`sslmode=no-verify` still uses TLS, but skips certificate-chain verification.
Prefer a verified CA setup later if this service handles sensitive production
traffic.

Create the `TOEIC_STORAGE_BUCKET` bucket in Supabase Storage and upload the TOEIC
audio/image assets to the paths the admin endpoints expect.

### Railway API

Set these variables in the Railway service:

```env
NODE_ENV=production
DATABASE_URL=<supabase-postgres-url>
JWT_SECRET=<64-plus-character-secret>
ACCESS_TOKEN_TTL_SECONDS=900
REFRESH_TOKEN_TTL_DAYS=30
CORS_ORIGIN=https://<vercel-web-domain>
REFRESH_TOKEN_COOKIE_NAME=engvocab.refreshToken
REFRESH_TOKEN_COOKIE_SECURE=true
REFRESH_TOKEN_COOKIE_SAME_SITE=none
AUTH_RATE_LIMIT_LIMIT=10
AUTH_RATE_LIMIT_TTL_SECONDS=60
BCRYPT_SALT_ROUNDS=10
GOOGLE_CLIENT_ID=<google-oauth-client-id>
SUPABASE_URL=<supabase-project-url>
SUPABASE_SERVICE_ROLE_KEY=<supabase-service-role-key>
TOEIC_STORAGE_BUCKET=toeic-media
TOEIC_SIGNED_URL_TTL_SECONDS=900
TOEIC_GRADING_INDEX_URL=https://<project-ref>.supabase.co/storage/v1/object/public/toeic/grading-index.json
```

Do not set `PORT` manually on Railway unless needed; Railway provides it.

The root path `/` may return `404`. Use `/health` or auth endpoints for smoke
tests.

### Production smoke tests

Set the API URL:

```bash
API=https://<railway-api-domain>
```

Login with a missing user should return `401`, not `500`:

```bash
curl -i -X POST "$API/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"notfound@example.com","password":"test123456"}'
```

Register, refresh, and logout should work with the HttpOnly refresh cookie:

```bash
curl -i -c cookies.txt -b cookies.txt \
  -X POST "$API/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email":"prodtest@example.com","password":"test123456","name":"Prod Test"}'

curl -i -c cookies.txt -b cookies.txt \
  -X POST "$API/auth/refresh"

curl -i -c cookies.txt -b cookies.txt \
  -X POST "$API/auth/logout"
```

## Docker

Build the API image (Node 22, multi-stage, runs `prisma generate` + `nest build`):

```bash
docker build -t engvocab-server .
```

Run the API container against the local PostgreSQL container:

```bash
docker run --rm -p 3001:3001 \
  --env-file .env \
  --add-host=host.docker.internal:host-gateway \
  engvocab-server
```

When running from Docker, use a `DATABASE_URL` that the container can reach, for example:

```bash
DATABASE_URL="postgresql://engvocab:engvocab@host.docker.internal:5433/engvocab"
```

## Database

Local PostgreSQL runs on port `5433` to avoid conflicts with a system PostgreSQL on `5432`.

Prisma schema:

```bash
prisma/schema.prisma
```

Key models:

- `User` — email/password or Google (`googleSub`), `role` (`USER`/`ADMIN`)
- `RefreshSession` — hashed, revocable refresh tokens
- `VocabWord` + `VocabWordDefinition` — user vocabulary with SRS fields (`level`, `wrongCount`, `lastReview`, `nextReview`) and soft delete (`deletedAt`), scoped to a `WordCollection`
- `WordCollection` — `SYSTEM` or `USER` kind, optional owner, CEFR level, default/public flags
- `CatalogWord` + `CatalogDefinition` — shared Oxford catalog, separate from user vocabulary
- `CollectionCatalogItem` — joins catalog words into collections
- `ToeicTest` -> `ToeicTestPart` -> `ToeicQuestionGroup` -> `ToeicQuestion` — TOEIC content tree
- `ToeicRun` + `ToeicRunGroup` + `ToeicRunQuestion` — full test runs (`PRACTICE`/`MOCK_TEST`)
- `ToeicPartPracticeRun` + groups + questions — per-part practice sessions

Create a migration after schema changes:

```bash
pnpm prisma migrate dev --name <migration_name>
```

Apply existing migrations:

```bash
pnpm prisma migrate deploy
```
