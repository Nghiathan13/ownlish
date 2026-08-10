# Ownlish operations checklist

This file is a runbook for the manual checkpoints that intentionally stay out
of Git: credentials, DNS, content publication, backups and the PostgreSQL
cutover.

## GitHub deployment secrets

Add these repository secrets before the first staging deployment:

```text
VPS_DEPLOY_HOST=51.79.157.211
VPS_DEPLOY_PORT=22
VPS_DEPLOY_USER=deploy
VPS_DEPLOY_PRIVATE_KEY=<private key for deploy>
VPS_KNOWN_HOSTS=<ssh-keyscan output for 51.79.157.211>
```

Create GitHub Environments named `staging` and `production`. Leave staging
without a reviewer; require approval for production.

## VPS environment files

Copy `infra/env/staging.env.example` and
`infra/env/production.env.example` to `/opt/ownlish/env/`. Fill secrets there
with mode `0600`; never put them in GitHub Actions secrets or the repository.

```bash
sudo install -m 0600 -o deploy -g deploy staging.env /opt/ownlish/env/staging.env
sudo install -m 0600 -o deploy -g deploy production.env /opt/ownlish/env/production.env
```

Use the assets R2 token in each application environment because Nest only
writes avatars. Keep the content-publisher and backup R2 tokens out of these
application files.

## R2 publication and validation

Use the content-publisher R2 token in a protected local shell. Publish to
staging first, inspect its manifest and sample public URLs, then repeat with
the production bucket.

```bash
pnpm --filter ownlish-server toeic:publish -- \
  --source ../../content/toeic --bucket ownlish-content-staging --prefix toeic

pnpm --filter ownlish-server storage:manifest -- \
  --bucket ownlish-content-staging --prefix toeic
```

The Dictation authoring pipeline remains in `~/Documents/dictation`. Its
`scripts/sync_to_ownlish_content.py` copies approved JSON to
`content/dictation`; `scripts/publish_dictation_to_r2.py` publishes it with
the content-publisher token.

Configure each R2 bucket with the token scoped to it:

```bash
pnpm --filter ownlish-server storage:configure-cors -- --bucket ownlish-content-staging
pnpm --filter ownlish-server storage:configure-cors -- --bucket ownlish-assets-staging
```

For the one-time old Storage copy, run `storage:migrate-supabase` with a
protected shell that has both the old Supabase service-role key and the target
R2 token. Run `--dry-run` and compare the object count, key manifest and byte
total before the real copy. Avatar keys must remain `users/<user-id>/...`.

## Deployment and backup

Pushes to `main` deploy staging. Use `Deploy Ownlish` → `Run workflow` with a
full 40-character commit SHA for production. After the first production
release, enable the timers:

```bash
sudo /opt/ownlish/current/production/infra/scripts/install-backup-timers.sh
systemctl list-timers 'ownlish-backup-*'
```

Run one daily backup and restore its custom-format dump into an isolated
database before cutover. Do not route public traffic or stop the old backend
until that restore and staging smoke tests pass.

## Final database cutover

Use Supabase's direct PostgreSQL connection string, not its pooler. During a
maintenance window: stop Railway writes, take the final `pg_dump`, restore to
the production PostgreSQL container, run `prisma migrate deploy`, and validate
row counts plus login, avatar, TOEIC, Dictation, review and dashboard flows.
Keep Vercel, Railway and Supabase intact for 14 days. Once Ownlish accepts new
writes, rollback to Supabase is no longer safe.
