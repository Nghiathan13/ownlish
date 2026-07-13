# EngVocab Web

EngVocab Web is the Next.js client for learning and reviewing English
vocabulary and practicing TOEIC questions. It connects to the
[EngVocab NestJS API](https://github.com/Nghiathan13/engvocab-server) for
authentication, collections, review progress, test sessions, and admin data.

## Features

- **Authentication:** email/password login and registration, optional Google
  Identity Sign-In, session restoration, logout, and role-aware admin UI.
- **Dashboard:** total, due, mastered, high-wrong-count, and level-distribution
  statistics for the user's default vocabulary collection.
- **Collections and vocabulary:** create, rename, and delete custom
  collections; browse Oxford, TOEIC, and IELTS system catalogs; import a full
  catalog or selected definitions into the default collection; search,
  paginate, add, edit, and delete vocabulary definitions.
- **Review:** collection-specific due-word queues, Remember/Forgot scheduling,
  and keyboard controls (`Space` to reveal, `1` for Forgot, `2` for Remember).
- **TOEIC:** mock tests, graded practice, wrong-answer review, part selection,
  aggregate Part 1-7 practice across tests, progress/history controls,
  bilingual content, evidence highlighting, and signed audio/image media.
- **TOEIC admin:** browse imported tests, preview groups and questions, edit
  structured fields or TXT/JSON group ranges, and upload/delete supported MP3
  and PNG media. The Users and Vocabulary Content admin areas are placeholders.
- **Application shell:** responsive desktop/mobile navigation and immersive
  layouts for test runs and TOEIC content editing.

Current boundaries: the TOEIC year picker supports 2019-2026 and defaults to
2026; mock results report answered/correct/wrong counts without a timer or
scaled TOEIC score; admin tools edit existing imported tests rather than
creating, importing, or deleting tests.

## Tech Stack

| Area | Technology |
| --- | --- |
| Framework | Next.js 16 App Router, React 19 |
| Language | TypeScript with strict mode |
| Server state | TanStack React Query 5 |
| Styling | Tailwind CSS 4, CSS theme variables, `tailwind-merge` |
| Testing | Vitest 4 |
| Static analysis | ESLint 9 with Next.js Core Web Vitals and TypeScript rules |
| Package manager | pnpm 11.2.2 |

## Prerequisites

- Node.js 22 is recommended and is the version used by CI. Next.js 16 requires
  Node.js 20.9 or newer.
- pnpm 11.2.2.
- A compatible EngVocab API. The local defaults expect it at
  `http://localhost:3001`, with `http://localhost:3000` allowed by CORS.

## Local Development

Install the locked dependencies and create the local environment file:

```bash
pnpm install --frozen-lockfile
cp .env.example .env.local
```

Start the EngVocab API, then run the web client:

```bash
pnpm dev
```

Open `http://localhost:3000`.

Google Sign-In is optional. To enable it, set
`NEXT_PUBLIC_GOOGLE_CLIENT_ID` in `.env.local` and configure the backend's
`GOOGLE_CLIENT_ID` with the same OAuth web client ID. If the frontend variable
is empty, the Google button is not rendered. Add `http://localhost:3000` and
the deployed web origin to that client's Authorized JavaScript origins.

## Environment Variables

| Name | Required | Default | Purpose |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_API_BASE_URL` | No | `http://localhost:3001` | Browser-facing API base URL for non-BFF requests |
| `AUTH_API_BASE_URL` | No | `NEXT_PUBLIC_API_BASE_URL`, then `http://localhost:3001` | Server-only API base URL used by the same-origin auth BFF |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Google Sign-In only | Empty | Google Identity Services web client ID; an empty value hides Google Sign-In |

Values prefixed with `NEXT_PUBLIC_` are included in the browser bundle. Do not
put secrets in them, and set their production values before building.

## Available Scripts

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Start the Next.js development server |
| `pnpm test` | Run the Vitest unit test suite once |
| `pnpm lint` | Run ESLint across the project |
| `pnpm build` | Create a production build |
| `pnpm start` | Serve an existing production build |

Run the same quality gates as CI before pushing:

```bash
pnpm test
pnpm lint
pnpm build
```

GitHub Actions uses Node.js 22 and pnpm 11.2.2, then runs these gates after a
frozen-lockfile install for pushes and pull requests to `main`. Unit tests are
colocated as `*.test.ts`; no browser E2E suite is configured yet.

## Main Routes

| Route | Access | Purpose |
| --- | --- | --- |
| `/` | Public | Guest landing page or authenticated vocabulary dashboard |
| `/login` | Public | Email/password login, registration, and optional Google Sign-In |
| `/collections?tab=user\|oxford\|toeic\|ielts` | Authenticated | User collections and system catalogs |
| `/collections/[collectionId]?kind=user\|system` | Authenticated | User vocabulary or system catalog detail |
| `/review?collectionId=...` | Authenticated | Due-word review for a selected collection |
| `/tests?tab=mock_tests&year=...` | Authenticated | TOEIC test catalog and per-test progress |
| `/tests?tab=part_practice&part=1..7` | Authenticated | Aggregate TOEIC part practice and progress |
| `/tests/[sessionId]/practice?parts=1,2,...` | Authenticated | Graded test practice for selected parts |
| `/tests/[sessionId]/review_wrong?parts=1,2,...` | Authenticated | Review previously missed questions |
| `/tests/[sessionId]/mock_test?parts=1,2,...` | Authenticated | Mock run graded when the user finishes |
| `/tests/part-practice/[sessionId]?mode=practice\|review_wrong` | Authenticated | Aggregate part practice or wrong-answer review |
| `/admin`, `/admin/toeic`, `/admin/toeic/[testId]` | Admin | Admin landing, TOEIC catalog, and content editor |
| `/api/auth/login\|register\|google\|refresh\|logout` | Internal BFF | Same-origin proxy endpoints for authentication |

`RequireAuth` and `RequireAdmin` provide client-side navigation guards. The API
must still enforce authentication and authorization for protected operations.

## Project Structure

The codebase uses a pragmatic layered, feature-first structure:

```text
src/
├── app/       Next.js routes, layouts, loading UI, and auth BFF route handlers
├── server/    Server-only auth proxy and refresh-cookie helpers
├── entities/  Domain types, API clients, response parsers, and cache helpers
├── features/  Auth, collections, review, tests, admin, home, and shell modules
└── shared/    HTTP/config, providers, generic hooks, utilities, and UI primitives
```

Most route files delegate feature behavior to `src/features`; route-local
composition remains where it is page-specific. API clients treat JSON responses
as `unknown` and generally validate data used by the UI with domain parsers.
TanStack Query owns remote state, while small contexts handle auth, theme, and
the immersive test toolbar. Internal imports use the `@/*` alias defined in
`tsconfig.json`.

## Authentication and API Flow

```text
login / register / Google / refresh / logout
Browser -> same-origin /api/auth/* -> Next.js BFF -> EngVocab API
                                      |
                                      +-> first-party refresh cookie on web origin

authenticated application data
Browser -> NEXT_PUBLIC_API_BASE_URL with an in-memory Bearer access token
```

- The BFF forwards auth requests through `AUTH_API_BASE_URL` and extracts the
  refresh token from the upstream `Set-Cookie` response.
- The BFF stores that token on the web origin as `engvocab.refreshToken`, with
  `HttpOnly`, `SameSite=Lax`, `Path=/api/auth`, a 30-day maximum age, and
  `Secure` in production.
- The access token exists only in module memory. On reload or token expiry, the
  client restores the session through `POST /api/auth/refresh`; concurrent
  refresh attempts are deduplicated.
- Non-auth data requests go directly from the browser to
  `NEXT_PUBLIC_API_BASE_URL` with a Bearer token, so the backend must allow the
  exact web origin through CORS.
- The backend must keep its refresh cookie name as `engvocab.refreshToken`
  because that is the upstream cookie name expected by the BFF. The browser
  uses the cookie attributes set by the web BFF, not the backend-domain cookie.

`localStorage` is used for UI preferences and local run/navigation state such
as the collapsed sidebar, visible table columns, bilingual/evidence settings,
the current practice step, and mock audio progress. Authentication tokens are
not stored there.

## Deployment

The project can use a standard Next.js deployment. For a Vercel Git deployment,
set the following project environment variables:

```env
NEXT_PUBLIC_API_BASE_URL=https://<backend-production-url>
AUTH_API_BASE_URL=https://<backend-production-url>
NEXT_PUBLIC_GOOGLE_CLIENT_ID=<optional-google-web-client-id>
```

Configure the backend for the deployed web origin:

```env
CORS_ORIGIN=https://<web-production-url>
REFRESH_TOKEN_COOKIE_NAME=engvocab.refreshToken
```

When Google Sign-In is enabled, also set the backend `GOOGLE_CLIENT_ID` to the
same web client ID. Backend database, media storage, and hosting are configured
in the API repository; this client consumes the resulting API endpoints and
signed media URLs.

## Production Smoke Test

This checklist assumes the backend contains system catalogs and TOEIC content;
the admin step also requires an `ADMIN` account. After deploying both apps:

- Register or sign in, then reload; the session should restore through the
  same-origin refresh route.
- Verify dashboard statistics and custom collection creation, editing,
  deletion, and system-catalog import.
- Search and paginate vocabulary, then add, edit, and delete definitions.
- Review due words with Remember/Forgot and verify progress updates.
- Start practice and answer at least one question incorrectly, then verify that
  question is available in wrong-answer review.
- Start aggregate part practice and a mock test; finish the mock test and verify
  its answered/correct/wrong counts.
- With an admin account, open the TOEIC catalog and an existing test editor.

While signed in, check browser DevTools:

- Neither `localStorage` nor `sessionStorage` should contain an access token or
  refresh token.
- The web origin should have an `engvocab.refreshToken` cookie marked
  `HttpOnly`, `Secure` in production, `SameSite=Lax`, and `Path=/api/auth`.
- Direct data requests to the backend should complete without CORS errors.

Finally, log out and reload. The previous session should not restore, and the
refresh cookie should be absent.
