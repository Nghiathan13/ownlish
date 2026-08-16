# Server operational scripts

This directory contains explicit operational entry points. Invoke them through
the named `pnpm` commands in `apps/server/package.json`, not by copying their
implementation paths into runbooks.

Scripts may load configuration, invoke application behavior, report a result,
and close resources. New or refactored business logic belongs under `src/` so
it is importable and testable; legacy script logic is migrated only as part of
a scoped change.

## Layout

```text
scripts/
  catalog/                  # Build, publish, and project learning catalogs
  storage/                  # R2 inspection, CORS, and one-time migration tools
  testing/                  # Deterministic data preparation for quality checks
```

## Catalog

| Command | Effect |
| --- | --- |
| `pnpm toeic:catalog -- --source <dir> --out <dir>` | Build TOEIC browser artifacts and the server grading index locally. |
| `pnpm toeic:publish -- --source <dir> [--bucket <bucket>] [--prefix <prefix>]` | Publish a built TOEIC catalog to R2. Use `--dry-run` before writing. |
| `pnpm dictation:sync-catalog` | Validate the approved Dictation catalog at `DICTATION_CATALOG_ROOT` and project it into the configured database. |

Run Dictation sync in the target environment after its catalog is published and
before releasing clients that submit Dictation answers.

## Storage

| Command | Effect |
| --- | --- |
| `pnpm storage:manifest -- --bucket <bucket> [--prefix <prefix>]` | Read and print an R2 object manifest. |
| `pnpm storage:configure-cors -- --bucket <bucket> [--allow-localhost]` | Replace CORS configuration for the selected R2 bucket. |
| `pnpm storage:migrate-supabase -- --source-bucket <bucket> --target-bucket <bucket> [--target-prefix <prefix>]` | Copy an existing Supabase Storage bucket to R2. Use `--dry-run` first. |

The migration command needs protected source and target credentials. It never
deletes either bucket, but still writes target objects and must not be run
against an unintended environment.

## Testing

| Command | Effect |
| --- | --- |
| `pnpm lighthouse:seed` | Seed the deterministic API fixture required by authenticated Lighthouse checks. |
