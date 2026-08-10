# Ownlish

> Make English your own.

Ownlish is a bilingual English-learning platform for vocabulary review, TOEIC
practice, Dictation and learning activity tracking.

## Workspace

```text
apps/web       Next.js application
apps/server    NestJS API, Prisma schema and catalog publisher
content/       ignored local final TOEIC/Dictation data
infra/         Docker, Caddy, VPS deployment and backup configuration
```

`~/Documents/dictation` remains the external authoring pipeline for Dictation
scripts and drafts. Only approved JSON is synchronized into
`content/dictation`; no source media, drafts or secrets are committed.

## Local development

```bash
pnpm install --frozen-lockfile
pnpm dev:server
pnpm dev:web
```

Run all repository quality checks with:

```bash
pnpm lint
pnpm test
pnpm build
```

## Environments

| Environment | Web | API | Content |
| --- | --- | --- | --- |
| Production | `https://ownlish.com` | `https://api.ownlish.com` | `https://content.ownlish.com` |
| Staging | `https://staging.ownlish.com` | `https://api.staging.ownlish.com` | `https://content.staging.ownlish.com` |

R2 assets use `assets.ownlish.com` and `assets.staging.ownlish.com`.

## Deployment

Pushes to `main` deploy staging after root quality checks. Production is a
manual GitHub Actions dispatch and requires an exact commit SHA plus the
`production` environment approval.

The VPS keeps secrets only in `/opt/ownlish/env/*.env`. Copy the matching
template from `infra/env/`, fill it locally on the VPS, and never commit it.

```bash
# Once the first production release and production environment file exist on the VPS
sudo /opt/ownlish/current/production/infra/scripts/install-backup-timers.sh
systemctl list-timers 'ownlish-backup-*'
```

The backup policy keeps 14 daily and 8 weekly PostgreSQL custom-format dumps
in the private `ownlish-backups-prod` R2 bucket.

See [the operations checklist](infra/OPERATIONS.md) for the protected
credentials, R2 publication, staging smoke test and final cutover sequence.

## Migration safety

Staging must pass catalog, auth, review, TOEIC, Dictation and avatar smoke
tests before DNS is changed. The final Supabase database export happens only
during a maintenance window after the old backend has stopped accepting writes.
Keep the previous Vercel, Railway and Supabase services unchanged for 14 days.
