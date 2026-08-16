# Ownlish Web

Ownlish is a bilingual English-learning web app for vocabulary review, TOEIC
practice, dictation, and learning-activity tracking. This repository contains
the Next.js client; the companion [Ownlish API](../../README.md)
provides authentication, learning data, test sessions, and catalog management.

## Documentation

- [Architecture](ARCHITECTURE.md): FSD, Next route adapters, and auth boundary.
- [Configuration](CONFIGURATION.md): local, browser, server-only, and deployed
  environment values.
- [Testing](TESTING.md): Vitest, Playwright, Lighthouse, coverage, and CI.
- [Scripts](scripts/README.md): quality and Lighthouse tooling.
- [Operations](../../infra/OPERATIONS.md): staging/production deployment,
  catalog publication, backups, and smoke tests.

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
- **Authentication:** passwordless email OTP, optional Google Sign-In, session
  restoration, and role-aware admin access.

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
  <img src="./docs/tech/vitest.svg" height="42" alt="Vitest">
  &nbsp;&nbsp;
  <img src="./docs/tech/playwright.svg" height="42" alt="Playwright">
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
- A compatible Ownlish API. Local development expects it at
  `http://localhost:3001`, with `http://localhost:3000` allowed by CORS.
- Docker only when running the isolated browser E2E database.

## Local development

Set up the API first by following its
[local setup](../server/README.md#local-development).
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

See [CONFIGURATION.md](CONFIGURATION.md) for Google OAuth, catalog roots, the
public/server-only boundary, and deployed configuration.

## Main routes

| Route | Access | Purpose |
| --- | --- | --- |
| `/` | Public | Landing page or authenticated dashboard |
| `/login` | Public | Passwordless email OTP and optional Google sign-in. |
| `/dashboard` | Authenticated | Learning activity, progress, and leaderboards. |
| `/collections` | Authenticated | Personal and Oxford vocabulary collections. |
| `/review` | Authenticated | Personal and Oxford spaced review. |
| `/tests` | Authenticated | TOEIC practice, wrong-answer review, and mock tests. |
| `/dictation` | Authenticated | Dictation catalog and study sessions. |
| `/admin` | Admin | Admin landing page |
