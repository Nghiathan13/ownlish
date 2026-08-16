# Ownlish API testing

This document describes how to run and organize tests in `apps/server`.
`ARCHITECTURE.md` defines the server test policy; `package.json` is the
executable command source of truth.

## Test layout

```text
src/
  **/*.spec.ts              # Colocated unit and focused integration tests
test/
  *.e2e-spec.ts             # HTTP + database end-to-end flows
  helpers/                  # Shared E2E setup, parsing, and test data helpers
  jest-e2e.json             # E2E Jest configuration
  setup-env.ts              # E2E-safe runtime defaults
performance/
  *.test.mjs                # Performance utility tests
```

Keep a unit test next to the behavior it verifies. Add an E2E spec only when a
change crosses HTTP, authentication, persistence, or feature-transaction
boundaries. Reuse `test/helpers` instead of copying authentication or Prisma
setup into each spec.

## Commands

Run these commands from `apps/server`:

| Command | Purpose |
| --- | --- |
| `pnpm test` | Run colocated Jest tests. |
| `pnpm test:cov` | Run Jest tests with coverage reports. |
| `pnpm test:e2e` | Run the Nest HTTP/database E2E suite. |
| `pnpm performance:test` | Run Node tests for the performance utilities. |
| `pnpm lint:check` | Check TypeScript source, scripts, tests, and performance files. |
| `pnpm build` | Compile the production server. |

## Database safety

The E2E suite uses the current `DATABASE_URL`; CI supplies an isolated
PostgreSQL service. Before running it locally, point `DATABASE_URL` at a
disposable local database. Never run E2E tests against staging or production.
The suite creates and deletes test data.

Unit tests use the defaults in `src/testing/jest.setup.ts` when the relevant
environment values are absent. They should mock external IO and must not rely
on a staging service.

## CI

Server CI generates Prisma, applies migrations to its isolated database, then
runs lint, unit tests, E2E tests, and the production build. Coverage artifacts
are reported separately at the workspace root.
