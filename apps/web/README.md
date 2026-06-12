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

## Deployment

The recommended production host is Vercel through Git integration.

Set this environment variable in the Vercel project:

```env
NEXT_PUBLIC_API_BASE_URL=https://<backend-production-url>
```

After Vercel creates the web deployment URL, update the backend production
environment so browser requests are allowed:

```env
CORS_ORIGIN=https://<web-production-url>
```

Use the default Vercel build settings:

```bash
pnpm install --frozen-lockfile
pnpm build
```

## Current Scope

- Login/register with the backend API
- Restore session through the backend HttpOnly refresh-token cookie
- Dashboard stats from `/vocab/stats`
- Vocabulary list, create, update, delete
- Due-word review with Remember/Forgot scheduling

## CI

GitHub Actions runs tests, lint, and production build on pushes and pull
requests targeting `main`.
