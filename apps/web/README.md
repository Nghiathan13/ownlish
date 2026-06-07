# EngVocab Web

Next.js web client for EngVocab.

## Local Setup

Install dependencies:

```bash
pnpm install
```

Create local env:

```bash
cp .env.example .env.local
```

Run the app:

```bash
pnpm dev
```

The web app runs on `http://localhost:3000`.

## Environment Variables

| Name | Required | Default | Purpose |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_API_BASE_URL` | No | `http://localhost:3001` | EngVocab API base URL |

## Current Scope

- Login/register with the backend API
- Restore session through `/auth/me`
- Protected `/vocabulary` placeholder
