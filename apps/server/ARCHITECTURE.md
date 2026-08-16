# Ownlish API architecture

This document defines how server code is organized and changed. It applies to
all new server work and to code touched during a refactor. Existing root-domain
modules are legacy code until they are deliberately migrated; this document does
not require an unrelated rewrite.

## Authority and terminology

NestJS does not prescribe an FSD-style backend directory layout. Its documented
architecture is feature modules that encapsulate related capabilities, with
controllers handling HTTP requests and providers implementing application
behavior. A module's exports are its public dependency-injection interface.

- [NestJS modules](https://docs.nestjs.com/modules)
- [NestJS controllers](https://docs.nestjs.com/controllers)
- [NestJS providers](https://docs.nestjs.com/providers)

The `api`, `model`, and `data` layers below are therefore an **Ownlish policy**,
not a NestJS or industry-mandated standard. Their purpose is to make feature
boundaries, data access, and test ownership explicit.

In this document:

- A **feature** is one user-facing capability or bounded application domain,
  such as `experience` or `leaderboard`.
- A **feature module** is the NestJS module that owns that feature's providers,
  controllers, and explicit public exports.
- A **legacy module** is an existing root-domain module outside `src/features`.

## Server layout

```text
apps/server/
├─ ARCHITECTURE.md        # This code-architecture and policy document
├─ README.md              # Setup, operations, storage, deployment, commands
├─ prisma/                # Prisma schema and append-only SQL migrations
├─ scripts/               # Explicit operational commands
├─ src/
│  ├─ app/                # Composition root: AppModule and application shell
│  ├─ common/             # Technical code genuinely shared by multiple features
│  ├─ config/             # Environment parsing and configuration
│  ├─ features/           # New and deliberately refactored feature modules
│  ├─ observability/      # Cross-cutting telemetry and request instrumentation
│  ├─ prisma/             # Nest Prisma service and module
│  └─ <legacy-domain>/    # Existing modules pending a scoped migration
└─ test/                  # HTTP/database end-to-end tests and E2E helpers
```

`src/entities` currently contains TOEIC catalog support code. It is retained as
an existing shared domain location; it is not a second feature-layer convention.
New product behavior belongs to a feature that owns it unless it is proven to be
shared technical infrastructure.

## Feature-module standard

```text
src/features/<feature>/
├─ api/
│  ├─ dto/
│  └─ <feature>.controller.ts
├─ data/
│  └─ <purpose>.repository.ts
├─ model/
│  ├─ <use-case>.service.ts
│  ├─ <concept>.ts
│  └─ <concept>.types.ts
├─ <feature>.module.ts
└─ *.spec.ts              # Colocated with the behavior they verify
```

The layout is intentionally conditional:

- Create `api/` only when the feature exposes HTTP input/output.
- Create `data/` only when the feature owns persistence or external IO.
- Keep a small feature in fewer files when splitting it would create empty
  layers or single-use abstractions.
- A feature always has one module when it contributes Nest providers or HTTP
  routes. The root `AppModule` imports that module.

### `api/`: transport boundary

`api/` contains controllers, request DTOs, and HTTP-only response mapping.
Controllers authenticate/authorize through the established Nest guards, accept
validated DTOs, call a model service, and return the explicit public response.
They do not contain business decisions, Prisma queries, or persistence mapping.

DTO decorators are the HTTP input contract. The application already configures
Nest's global `ValidationPipe` with `whitelist`, `forbidNonWhitelisted`, and
`transform`; new request fields must be represented and validated by a DTO.
[NestJS validation](https://docs.nestjs.com/techniques/validation)

### `model/`: use cases and business rules

`model/` owns application use cases, business rules, feature types, and pure
helpers. It can coordinate local repositories and providers explicitly exported
by another feature module. It must not import from its own `api/` layer or use
HTTP request/response objects as domain values.

The model service that owns a multi-write use case owns its transaction boundary.
Collaborating services receive the existing transaction client rather than
opening a competing transaction. Network access and other slow work happen
before or after the transaction, never inside it. Prisma documents interactive
transactions as an escape hatch and warns that long-running transactions can
hurt performance or deadlock. [Prisma transactions](https://www.prisma.io/docs/orm/prisma-client/queries/transactions)

### `data/`: persistence and external data access

`data/` contains repositories and feature-owned external data gateways. A
repository encapsulates Prisma query details and accepts a Prisma client or the
caller-provided transaction client when the use case is transactional. It does
not make authorization, XP, ranking, scheduling, or other business-policy
decisions, and it does not return HTTP DTOs.

External input is parsed and validated at the gateway boundary before it reaches
the model. For example, the Dictation catalog sync validates its published
catalog before projecting it into PostgreSQL.

### Module and dependency boundaries

- A module registers only the controllers and providers it owns.
- It exports only providers intentionally used by another feature.
- A consumer imports the owning module and injects that exported provider.
- Cross-feature code must not import another feature's `api/`, `data/`, or
  private model helper directly.
- Avoid circular module dependencies. `forwardRef()` is a documented technical
  escape hatch, not a default architectural tool.

## Shared and infrastructure code

`common/` is for technical behavior that is actually reused by two or more
features and has no product-domain owner: for example, a generic guard,
decorator, or date utility. It is not a catch-all folder.

`config/` owns runtime configuration for application modules. Feature code
imports the typed `env` object instead of reading environment variables
directly. A script may read explicit command configuration at its entry point
before it invokes code under `src/`; test setup and observability bootstrap are
the existing non-feature exceptions.

`prisma/` provides the Nest integration for database access. The declarative
schema and migration history remain in `apps/server/prisma/`, not inside a
feature. A feature owns its data model semantically; Prisma owns its physical
schema history.

`scripts/` contains named, reviewable operational entry points. Script business
logic belongs under `src/` so it remains importable and unit-testable; a script
should only load configuration, invoke that logic, report its result, and close
resources.

## Database and migrations

- Change `prisma/schema.prisma` and commit the generated SQL migration together.
- Treat an applied migration as append-only. Correct a deployed schema with a
  new migration rather than editing history.
- Use `prisma migrate dev` only for a development database. Use `prisma migrate
  deploy` through the staging/production deployment workflow; do not point a
  local shell at production credentials.
- Use a transaction whenever a use case requires multiple writes to succeed or
  fail together.

Prisma distinguishes development migration creation from production deployment
and recommends running `migrate deploy` through CI/CD for deployed databases.
[Prisma Migrate workflow](https://www.prisma.io/docs/orm/prisma-migrate/workflows/development-and-production)

## Test policy

- Add a colocated `*.spec.ts` for every new behavior: service use cases, pure
  helpers, DTO validation, repository query mapping, controller delegation, and
  module wiring when it has meaningful dependency composition.
- Do not create a standalone unit test for a barrel export, a Next/Nest adapter
  with no behavior, a Prisma migration, or a static type-only file. Cover them
  through the closest behavior, integration, build, or E2E test instead.
- Unit tests isolate IO with mocks or a test transaction client. Pure helpers
  are tested without Nest's runtime.
- Put full HTTP/auth/database flows in `apps/server/test/*.e2e-spec.ts`, using
  the shared E2E helpers rather than duplicating setup.
- Add an E2E test when a change affects authentication, public API contracts,
  persistence integration, or a cross-feature transaction.

NestJS recommends colocating unit tests with the code they test and keeping E2E
tests in `test/`. Its testing tools support isolated provider tests, DI-based
tests, and full HTTP application tests. [NestJS testing](https://docs.nestjs.com/fundamentals/testing)

## Change checklist

Before a server change is ready:

1. Name the owning feature and put new behavior in its appropriate layer.
2. Keep controller, model, data, and cross-feature dependency boundaries intact.
3. Validate external input at its boundary and return only the intended public
   response fields.
4. Add behavior-focused unit tests and the necessary E2E coverage.
5. For schema changes, commit the schema and migration together and use the
   correct environment-specific Prisma command.
6. Run the affected test suite, lint, and build before handoff.
