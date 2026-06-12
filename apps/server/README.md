# EngVocab Server

NestJS API server for EngVocab. It provides authentication and vocabulary APIs for the web client and future desktop sync.

## Stack

- NestJS
- PostgreSQL
- Prisma
- JWT authentication
- Docker Compose for local PostgreSQL
- Jest and Supertest for unit/e2e tests

## Requirements

- Node.js
- pnpm
- Docker

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

Run migrations:

```bash
pnpm prisma migrate deploy
```

Start the API:

```bash
pnpm start:dev
```

The server runs on `http://localhost:3001` by default.

## Environment Variables

| Name | Required | Default | Purpose |
| --- | --- | --- | --- |
| `DATABASE_URL` | Yes | - | PostgreSQL connection string |
| `JWT_SECRET` | Yes | - | Secret used to sign access tokens. Must be at least 32 characters |
| `PORT` | No | `3001` | API server port |
| `CORS_ORIGIN` | No | `http://localhost:3000` | Allowed frontend origin |
| `ACCESS_TOKEN_TTL_SECONDS` | No | `900` | Access token lifetime in seconds |
| `BCRYPT_SALT_ROUNDS` | No | `10` | Password hashing cost |
| `REFRESH_TOKEN_TTL_DAYS` | No | `30` | Refresh token lifetime in days |
| `REFRESH_TOKEN_COOKIE_NAME` | No | `engvocab.refreshToken` | HttpOnly refresh token cookie name |
| `REFRESH_TOKEN_COOKIE_SECURE` | No | `true` in production, otherwise `false` | Whether the refresh cookie requires HTTPS |
| `REFRESH_TOKEN_COOKIE_SAME_SITE` | No | `none` when secure, otherwise `lax` | Refresh cookie SameSite policy: `lax`, `none`, or `strict` |
| `AUTH_RATE_LIMIT_LIMIT` | No | `10` | Request limit for auth endpoints |
| `AUTH_RATE_LIMIT_TTL_SECONDS` | No | `60` | Rate limit window for auth endpoints |

## API Overview

Health:

- `GET /health`

Auth:

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `GET /auth/me`

Vocabulary:

- `GET /vocab`
- `GET /vocab/stats`
- `GET /vocab/review/due`
- `GET /vocab/:id`
- `POST /vocab`
- `PATCH /vocab/:id`
- `PATCH /vocab/:id/review`
- `DELETE /vocab/:id`

Vocabulary endpoints require `Authorization: Bearer <accessToken>`.
Auth refresh tokens are stored in an HttpOnly cookie. For production web
deployments on a different domain, use `REFRESH_TOKEN_COOKIE_SECURE=true`,
`REFRESH_TOKEN_COOKIE_SAME_SITE=none`, and set `CORS_ORIGIN` to the exact web
origin.

## Checks

```bash
pnpm test
pnpm test:e2e
pnpm build
```

## Production Deployment

Recommended production architecture:

```txt
Vercel web client -> Railway NestJS API -> Supabase Postgres
```

### Supabase database

Use Supabase as the production PostgreSQL database. Apply Prisma migrations
before pointing production traffic at the API:

```bash
pnpm prisma migrate deploy
```

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

Build the API image:

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

Create a migration after schema changes:

```bash
pnpm prisma migrate dev --name <migration_name>
```

Apply existing migrations:

```bash
pnpm prisma migrate deploy
```
