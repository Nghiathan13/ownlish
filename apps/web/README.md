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

The recommended production host is Vercel through Git integration. The
production web app talks to the Railway API, which uses Supabase Postgres.

Set this environment variable in the Vercel project:

```env
NEXT_PUBLIC_API_BASE_URL=https://<backend-production-url>
```

After Vercel creates the web deployment URL, update the backend production
environment so browser requests are allowed:

```env
CORS_ORIGIN=https://<web-production-url>
```

For cross-site refresh-token cookies between Vercel and Railway, the backend
must also use:

```env
REFRESH_TOKEN_COOKIE_SECURE=true
REFRESH_TOKEN_COOKIE_SAME_SITE=none
```

Use the default Vercel build settings:

```bash
pnpm install --frozen-lockfile
pnpm build
```

## Production Smoke Test

After deploying the web and API:

- Register a new account.
- Log in and reload the page; the session should restore through the HttpOnly
  refresh-token cookie.
- Add, edit, delete, and search vocabulary words.
- Complete review actions with Remember/Forgot.
- Log out; refresh should no longer restore the session.

In browser DevTools:

- `localStorage` should not contain access or refresh tokens.
- The refresh cookie should be HttpOnly, Secure, and SameSite=None on the API
  domain.

## Current Scope

- Login/register with the backend API
- Restore session through the backend HttpOnly refresh-token cookie
- Dashboard stats from `/vocab/stats`
- Vocabulary list, create, update, delete
- Due-word review with Remember/Forgot scheduling

## CI

GitHub Actions runs tests, lint, and production build on pushes and pull
requests targeting `main`.
