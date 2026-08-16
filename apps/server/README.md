# Ownlish API

NestJS API for authentication, vocabulary review, TOEIC sessions, Dictation
progress and learning activity. It uses Prisma/PostgreSQL and Cloudflare R2 for
public assets.

See [ARCHITECTURE.md](ARCHITECTURE.md) for server code structure, feature-layer
boundaries, migration rules, and test policy. See
[CONFIGURATION.md](CONFIGURATION.md) for environment values and secret
boundaries, [TESTING.md](TESTING.md) for test commands and database safety, and
[scripts/README.md](scripts/README.md) for operational commands.

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
