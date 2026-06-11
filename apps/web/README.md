# EngVocab Web

Next.js web client for EngVocab. The app connects to the NestJS API and covers
authentication, vocabulary management, review flow, and dashboard stats.

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

## Quality Checks

Run the same checks used by CI:

```bash
pnpm test
pnpm lint
pnpm build
```

## Environment Variables

| Name | Required | Default | Purpose |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_API_BASE_URL` | No | `http://localhost:3001` | EngVocab API base URL |

## Current Scope

- Login/register with the backend API
- Restore session through `/auth/me`
- Dashboard stats from `/vocab/stats`
- Vocabulary list, create, update, delete
- Due-word review with Remember/Forgot scheduling

## CI

GitHub Actions runs tests, lint, and production build on pushes and pull
requests targeting `main`.
