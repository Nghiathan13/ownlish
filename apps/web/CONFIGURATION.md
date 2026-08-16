# Ownlish Web configuration

This document defines configuration for `apps/web`. The variable template is
[`.env.example`](.env.example); browser-facing runtime access is implemented in
`src/shared/config/env.ts`, and the same-origin authentication BFF reads
`AUTH_API_BASE_URL` in `src/_app/api-routes/auth`.

## Local configuration

Create an untracked local file before development:

```bash
cp .env.example .env.local
```

Next.js loads `.env.local` for local development. `NEXT_PUBLIC_` values are
included in the browser bundle, so they are not secrets and changing them for a
deployed environment requires a new Web build. See the
[Next.js environment-variable guide](https://nextjs.org/docs/app/guides/environment-variables)
for framework behavior.

## Variables

| Name | Exposure | Default | Purpose |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_API_BASE_URL` | Browser | `http://localhost:3001` | Direct API base URL for authenticated application data. |
| `AUTH_API_BASE_URL` | Server only | `NEXT_PUBLIC_API_BASE_URL`, then `http://localhost:3001` | Upstream API URL used by the same-origin auth BFF. It may use an internal Compose hostname in deployed environments. |
| `NEXT_PUBLIC_TOEIC_CATALOG_ROOT` | Browser | Empty | Public root for the published TOEIC catalog. |
| `NEXT_PUBLIC_DICTATION_CATALOG_ROOT` | Browser | Empty | Public Dictation root containing `catalog.json` and video JSON files. |
| `NEXT_PUBLIC_DICTIONARY_ROOT` | Browser | Empty | Public root containing dictionary JSON entries. |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Browser | Empty | OAuth web-client ID. When empty, Google sign-in is hidden. |

Do not add `GOOGLE_CLIENT_SECRET`, database URLs, R2 credentials, mailer keys,
or other secrets to this application. Google server credentials belong only in
the API environment.

## Environment relationships

- `NEXT_PUBLIC_API_BASE_URL` must be reachable from the browser and must match
  the API's configured `CORS_ORIGIN`.
- `AUTH_API_BASE_URL` is server-to-server only. In a deployed Compose setup it
  can use the private API service name while the public API URL remains
  browser-facing.
- The Web and API Google client IDs must refer to the same OAuth web client;
  the API alone holds its client secret.
- Catalog roots must point at the correct environment's public content domain.
  Publishing catalog files and projecting the Dictation catalog into the API
  database are separate operations.

## Deployed configuration

Deployment environment files live outside Git under `/opt/ownlish/env/` and
are consumed by the repository deployment workflow. See
[`../../infra/OPERATIONS.md`](../../infra/OPERATIONS.md) for staging and
production operations. Copy neither `.env.local` nor its secrets into Git.
