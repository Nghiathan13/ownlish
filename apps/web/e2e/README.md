# Browser E2E (Playwright)

Full-stack journeys against production builds of the Next.js web app and Nest
API, with an isolated PostgreSQL database (`e2e/docker-compose.yml`).

## Layout

```text
e2e/
  auth/                 # Login / signup / session / logout
  vocabulary/           # Vocabulary product journeys (auth only as setup)
  fixtures/             # Shared `test` / `expect` (extend with fixtures later)
  helpers/              # Pure utilities (env, identity, email outbox API)
  pages/                # Page objects (locators + user actions)
  docker-compose.yml    # E2E-only Postgres
```

| Layer                 | Role                                                               |
| --------------------- | ------------------------------------------------------------------ |
| `auth/*.e2e.ts`       | Independent email-OTP signup, session restore, and logout journeys |
| `vocabulary/*.e2e.ts` | Vocab flows; may sign up first but assert product behavior         |
| `pages/`              | UI locators and multi-step actions (POM)                           |
| `helpers/`            | Non-UI utilities (API outbox, run IDs, env)                        |
| `fixtures/`           | Playwright `test.extend` composition point                         |

Config lives at `apps/web/playwright.config.ts` (`testDir: ./e2e`, match
`**/*.e2e.ts`).

## Conventions

- Import `test` / `expect` from `../fixtures` (not directly from `@playwright/test`)
  so future fixtures stay consistent.
- Prefer role/label locators; keep third-party deps out of the critical path
  (OTP uses API `EMAIL_MAILER=outbox`, not Resend).
- Isolate data with `createRunIdentity()` (unique email/word per run).
- Group long journeys with `test.step` for readable traces and reports.

## Run

From `apps/web`:

```bash
pnpm test:e2e:install
pnpm test:e2e:db:up
pnpm test:e2e
pnpm test:e2e:db:down
```

## Adding a new flow

1. Spec under the right area folder: `e2e/<area>/<name>.e2e.ts`.
2. Reuse or add a page object under `pages/` if locators will be shared.
3. Put non-UI plumbing in `helpers/`.
4. When several tests need the same pre-state (logged-in user), add a fixture in
   `fixtures/` instead of copying signup steps.
