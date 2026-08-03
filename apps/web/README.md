# EngVocab Web

EngVocab is a bilingual English-learning web app for vocabulary review, TOEIC
practice, dictation, and learning-activity tracking. This repository contains
the Next.js client; the companion [EngVocab API](https://github.com/Nghiathan13/engvocab-server)
provides authentication, learning data, test sessions, and catalog management.

## Product snapshots

### Learning activity and vocabulary progress

![Dashboard showing learning activity, vocabulary progress, and difficult words](./docs/images/dashboard-review.webp)

### Dictation with YouTube-based listening practice

![Dictation study screen with video, transcript segments, and answer input](./docs/images/dictation-study.webp)

### TOEIC part practice

![TOEIC part-practice screen with audio, questions, and bilingual transcript](./docs/images/toeic-practice.webp)

## Features

- **Vocabulary collections:** create and manage personal collections; browse
  Oxford CEFR vocabulary by band and part; import system entries into a personal
  collection; search, edit, and remove definitions.
- **Spaced review:** review due vocabulary with keyboard support, levels,
  review scheduling, wrong-count tracking, and collection-specific progress.
- **Learning dashboard:** view study time, activity across six-month periods,
  streaks, vocabulary progress, level distributions, and difficult words.
- **TOEIC practice:** take graded practice, wrong-answer review, aggregate
  Part 1-7 practice, and timed mock tests with progress, history, and TOEIC
  listening/reading scores.
- **Dictation:** study curated YouTube videos through transcript segments,
  word hints, replay/loop controls, playback speed, and keyboard shortcuts.
- **Responsive application shell:** desktop and mobile navigation, light and
  dark themes, and focused immersive layouts for study sessions.
- **Authentication:** email/password sign-in and registration, optional Google
  Sign-In, session restoration, and role-aware admin access.

System catalogs and TOEIC content are supplied by the API and storage. A screen
can therefore be empty until its corresponding catalog has been published.

## Built with

<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="./docs/tech/nextdotjs-dark.svg">
    <img src="./docs/tech/nextdotjs.svg" height="42" alt="Next.js">
  </picture>
  &nbsp;&nbsp;
  <img src="./docs/tech/react.svg" height="42" alt="React">
  &nbsp;&nbsp;
  <img src="./docs/tech/typescript.svg" height="42" alt="TypeScript">
  &nbsp;&nbsp;
  <img src="./docs/tech/tailwindcss.svg" height="42" alt="Tailwind CSS">
  &nbsp;&nbsp;
  <img src="./docs/tech/supabase.svg" height="42" alt="Supabase">
  &nbsp;&nbsp;
  <img src="./docs/tech/vitest.svg" height="42" alt="Vitest">
  &nbsp;&nbsp;
  <img src="./docs/tech/playwright.svg" height="42" alt="Playwright">
  &nbsp;&nbsp;
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="./docs/tech/vercel-dark.svg">
    <img src="./docs/tech/vercel.svg" height="42" alt="Vercel">
  </picture>
</p>

## Tech stack

| Area | Technology |
| --- | --- |
| Framework | Next.js 16 App Router, React 19 |
| Language | TypeScript with strict mode |
| Server state | TanStack React Query 5 |
| Styling | Tailwind CSS 4, CSS theme variables, `tailwind-merge` |
| Testing | Vitest 4, React Testing Library, MSW 2, Playwright 1 |
| Static analysis | ESLint 9 with Next.js Core Web Vitals and TypeScript rules |
| Package manager | pnpm 11.2.2 |

## Prerequisites

- Node.js 22 and pnpm 11.2.2 (the versions used by CI).
- A compatible EngVocab API. Local development expects it at
  `http://localhost:3001`, with `http://localhost:3000` allowed by CORS.
- Docker only when running the isolated browser E2E database.

## Local development

Set up the API first by following its
[Local Setup](https://github.com/Nghiathan13/engvocab-server#local-setup).
That starts PostgreSQL, generates Prisma, applies migrations, and runs the API
on `http://localhost:3001`.

Install dependencies and create the local environment file:

```bash
pnpm install --frozen-lockfile
cp .env.example .env.local
```

Then run the web client:

```bash
pnpm dev
```

Open `http://localhost:3000`.

Google Sign-In is optional. Set `NEXT_PUBLIC_GOOGLE_CLIENT_ID` in `.env.local`
and configure the API's `GOOGLE_CLIENT_ID` with the same OAuth web client ID.
When the frontend variable is empty, the Google button is hidden. Add both the
local and deployed web origins to Google OAuth's Authorized JavaScript origins.

For local Dictation content, point `NEXT_PUBLIC_DICTATION_CATALOG_ROOT` to the
served catalog root, for example `http://localhost:3000/dictation` when the
catalog JSON files are available under `public/dictation`.

## Environment variables

| Name | Required | Default | Purpose |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_API_BASE_URL` | No | `http://localhost:3001` | Browser-facing API base URL for non-BFF requests |
| `AUTH_API_BASE_URL` | No | `NEXT_PUBLIC_API_BASE_URL`, then `http://localhost:3001` | Server-only API base URL for the same-origin auth BFF |
| `NEXT_PUBLIC_TOEIC_CATALOG_ROOT` | TOEIC runtime | Empty | Public root of the published TOEIC catalog |
| `NEXT_PUBLIC_DICTATION_CATALOG_ROOT` | Dictation runtime | Empty | Public root containing `catalog.json` and video JSON files |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Google Sign-In only | Empty | Google Identity Services web client ID |

Variables prefixed with `NEXT_PUBLIC_` are part of the browser bundle. Never
put secrets in them.

## Scripts

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Start the Next.js development server |
| `pnpm test` | Run all Vitest unit and component-integration tests |
| `pnpm test:unit` | Run Node-based `*.test.ts` tests |
| `pnpm test:component` | Run jsdom-based `*.test.tsx` tests |
| `pnpm test:e2e` | Build and run the full-stack Playwright suite against the sibling API repository |
| `pnpm test:e2e:db:up` | Start the isolated local E2E PostgreSQL database |
| `pnpm test:e2e:db:down` | Remove the isolated local E2E PostgreSQL database |
| `pnpm test:e2e:install` | Install Playwright Chromium |
| `pnpm lighthouse` | Run mobile Lighthouse baseline audits for `/` and `/login` after a production build |
| `pnpm lighthouse:summary` | Print the median and range from existing Lighthouse reports |
| `pnpm lighthouse:desktop` | Run desktop Lighthouse baseline audits for `/` and `/login` after a production build |
| `pnpm lighthouse:desktop:summary` | Print the desktop Lighthouse median and range from existing reports |
| `pnpm lighthouse:authenticated` | Run mobile Lighthouse baseline audits for authenticated stable routes |
| `pnpm lighthouse:authenticated:summary` | Print the authenticated mobile Lighthouse median and range |
| `pnpm lighthouse:authenticated:desktop` | Run desktop Lighthouse baseline audits for authenticated stable routes |
| `pnpm lighthouse:authenticated:desktop:summary` | Print the authenticated desktop Lighthouse median and range |
| `pnpm lighthouse:assert` | Check route-specific Lighthouse budgets using the median of three runs |
| `pnpm lighthouse:desktop:assert` | Check route-specific desktop Lighthouse budgets using the median of three runs |
| `pnpm lint` | Run ESLint |
| `pnpm build` | Create a production build |
| `pnpm start` | Serve an existing production build |

Run the same quality gates as CI before pushing:

```bash
pnpm test
pnpm lint
pnpm build
```

GitHub Actions uses Node.js 22 and pnpm 11.2.2, then runs these checks after a
frozen-lockfile install for pushes and pull requests to `main`.

### Browser E2E

The Playwright golden path covers protected-route redirection, email login via
the same-origin auth BFF, creating a vocabulary entry, session restoration
after reload, and logout. It runs production builds of both Next.js and NestJS
against a separate PostgreSQL database.

Keep `engvocab-web` and `engvocab-server` as sibling directories, install both
repositories' dependencies, then run:

```bash
pnpm test:e2e:install
pnpm test:e2e:db:up
pnpm test:e2e
pnpm test:e2e:db:down
```

The E2E database listens on `localhost:5434` and is distinct from the API
development database on port `5433`. Set `E2E_DATABASE_URL` to override it.

### Lighthouse

Run the mobile public-route Lighthouse checks locally after building the application:

```bash
pnpm build
pnpm lighthouse
```

It audits `/` and `/login` three times with the mobile profile, covering
Performance, Accessibility, Best Practices, and SEO. Results are written to
`.lighthouseci/`. The GitHub Actions Lighthouse job uploads the same reports as
the private `lighthouse-reports` artifact for 7 days and writes the median and
range to the Job Summary. CI checks route-specific budgets against the median
of all three runs, so a single noisy GitHub runner audit does not fail the job.

Desktop uses the same public routes and three-run median. Run it locally with:

```bash
pnpm build
pnpm lighthouse:desktop
pnpm lighthouse:desktop:summary
pnpm lighthouse:desktop:assert
```

Its reports are stored in `.lighthouseci-desktop/` and uploaded as the private
`lighthouse-desktop-reports` artifact for 7 days. CI checks its route-specific
desktop budgets using the median of all three runs.

### Authenticated Lighthouse baseline

Authenticated Lighthouse runs separately from the guest-route budgets. It uses
an isolated PostgreSQL database, the local API, and a deterministic fixture
account to audit the dashboard; Collections and Review user/Oxford views;
both Tests tabs; and Dictation library, Music, and BBC pages. Each route runs
three times for mobile and desktop. Mock-test sessions and the YouTube player
remain covered by browser E2E and production observability instead.

Install Chromium and start the isolated database first:

```bash
pnpm test:e2e:install
pnpm test:e2e:db:up
```

In the sibling API repository, migrate, seed, and start the local API:

```bash
export DATABASE_URL=postgresql://engvocab:engvocab@localhost:5434/engvocab_e2e
export PERFORMANCE_DATABASE_URL="$DATABASE_URL"
export JWT_SECRET=lighthouse-jwt-secret-at-least-32-characters
export PORT=3101 CORS_ORIGIN=http://localhost:3100
export REFRESH_TOKEN_COOKIE_SECURE=false REFRESH_TOKEN_COOKIE_SAME_SITE=lax
pnpm prisma generate && pnpm prisma migrate deploy && pnpm lighthouse:seed
pnpm build && pnpm start:prod
```

Then, in this repository, set the local API and catalog roots before building:

```bash
export LIGHTHOUSE_AUTH_EMAIL=performance-benchmark-vu-01@engvocab.local
export LIGHTHOUSE_AUTH_PASSWORD=performance-benchmark-password
export NEXT_PUBLIC_API_BASE_URL=http://localhost:3101 AUTH_API_BASE_URL=http://localhost:3101
export NEXT_PUBLIC_TOEIC_CATALOG_ROOT=http://localhost:3100/toeic
export NEXT_PUBLIC_DICTATION_CATALOG_ROOT=http://localhost:3100/dictation
pnpm build
pnpm lighthouse:authenticated
pnpm lighthouse:authenticated:summary
```

Use `pnpm lighthouse:authenticated:desktop` and
`pnpm lighthouse:authenticated:desktop:summary` for the desktop profile.
Reports are stored in `.lighthouseci-authenticated/` and
`.lighthouseci-authenticated-desktop/`; CI uploads the corresponding private
artifacts for seven days. These jobs are report-only until five successful
`main` runs establish route-specific budgets.

## Main routes

| Route | Access | Purpose |
| --- | --- | --- |
| `/` | Public | Landing page or authenticated dashboard |
| `/login` | Public | Email/password login, registration, and optional Google Sign-In |
| `/collections/user` | Authenticated | Personal collections |
| `/collections/user/[collectionId]` | Authenticated | Vocabulary table for a personal collection |
| `/collections/oxford/[band]` | Authenticated | Oxford CEFR band overview |
| `/collections/oxford/[band]/[part]` | Authenticated | Oxford vocabulary part |
| `/review` | Authenticated | Personal vocabulary review |
| `/review/oxford/[band]/[part]` | Authenticated | Oxford vocabulary review |
| `/tests` | Authenticated | TOEIC mock-test and part-practice catalog |
| `/tests/[sessionId]/practice` | Authenticated | Graded TOEIC practice |
| `/tests/[sessionId]/review_wrong` | Authenticated | Wrong-answer review for a TOEIC test |
| `/tests/[sessionId]/mock_test` | Authenticated | Timed TOEIC mock test |
| `/tests/part-practice/[sessionId]` | Authenticated | Aggregate part practice or wrong-answer review |
| `/dictation` | Authenticated | Dictation categories |
| `/dictation/music` | Authenticated | Music dictation catalog |
| `/dictation/bbc` | Authenticated | BBC dictation catalog |
| `/dictation/[videoId]` | Authenticated | Dictation study session |
| `/admin` | Admin | Admin landing page |

## Project structure

The app follows a pragmatic, feature-first structure:

```text
src/
├── app/       Next.js routes, layouts, loading UI, and auth BFF handlers
├── server/    Server-only auth proxy and refresh-cookie helpers
├── entities/  Domain types, API clients, response parsers, and cache helpers
├── features/  Product features such as collections, review, tests, dictation, and home
└── shared/    HTTP/config, providers, hooks, utilities, and UI primitives
```

Most route files delegate feature behaviour to `src/features`. TanStack Query
owns remote state; small contexts own local UI state such as authentication,
theme, and immersive study controls. Internal imports use the `@/*` alias.

## Authentication and API flow

```text
login / register / Google / refresh / logout
Browser -> same-origin /api/auth/* -> Next.js BFF -> EngVocab API
                                      |
                                      +-> first-party refresh cookie on web origin

authenticated application data
Browser -> NEXT_PUBLIC_API_BASE_URL with an in-memory Bearer access token
```

- The BFF forwards authentication requests through `AUTH_API_BASE_URL` and
  stores the upstream refresh token on the web origin.
- The access token remains in module memory. On reload or expiry, the client
  restores the session through `POST /api/auth/refresh`.
- Application-data requests go directly to `NEXT_PUBLIC_API_BASE_URL` with a
  Bearer token, so the API must allow the exact web origin through CORS.
- `localStorage` contains only UI and study preferences, never auth tokens.

## Deployment

The typical production topology is:

```text
Vercel web client -> NestJS API -> Supabase Postgres
                                 Supabase Storage (TOEIC and Dictation catalogs/media)
```

Set these variables in the Vercel project:

```env
NEXT_PUBLIC_API_BASE_URL=https://<backend-production-url>
AUTH_API_BASE_URL=https://<backend-production-url>
NEXT_PUBLIC_TOEIC_CATALOG_ROOT=https://<public-storage-root>/<toeic-prefix>
NEXT_PUBLIC_DICTATION_CATALOG_ROOT=https://<public-storage-root>/<dictation-prefix>
NEXT_PUBLIC_GOOGLE_CLIENT_ID=<optional-google-web-client-id>
```

Configure the API for the deployed web origin:

```env
CORS_ORIGIN=https://<web-production-url>
REFRESH_TOKEN_COOKIE_NAME=engvocab.refreshToken
```

The API repository contains the database, storage, and backend deployment
details in its [production deployment guide](https://github.com/Nghiathan13/engvocab-server#production-deployment).

## Production smoke test

After both applications and the catalogs are deployed:

- Sign in, reload, and confirm the session restores.
- Open the dashboard and verify activity/study time updates after learning.
- Create, edit, delete, and review vocabulary in a personal collection.
- Browse an Oxford band and complete a short review.
- Start TOEIC practice, wrong-answer review, and a mock test; finish the mock
  test and verify its result and history.
- Open a Dictation category, play a video, select segments, and submit input.
- Confirm direct API requests have no CORS errors and that browser storage does
  not contain access or refresh tokens.
