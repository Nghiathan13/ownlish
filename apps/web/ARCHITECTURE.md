# Ownlish Web architecture

## Purpose and scope

This document defines the boundaries of the Ownlish Next.js frontend. It
explains where code belongs, which modules may depend on each other, and how
the framework routing tree connects to Feature-Sliced Design (FSD). It applies
to all new web work and to code deliberately touched during a refactor; it
does not require an unrelated rewrite of legacy code.

It applies only to `apps/web`. The Nest API in `apps/server` follows Nest
modules and domain boundaries; it does not use FSD.

## Authority and terminology

FSD defines its layers, lower-layer import rule, slices, segments, and public
APIs. Next.js defines the App Router's special files and URL behavior. Neither
standard prescribes Ownlish's `_app` and `_pages` names or documentation
layout; those are local conventions documented here.

- [Feature-Sliced Design layers](https://feature-sliced.design/docs/reference/layers)
- [Feature-Sliced Design slices and segments](https://feature-sliced.design/docs/reference/slices-segments)
- [Next.js project structure](https://nextjs.org/docs/app/getting-started/project-structure)

## System context

```text
Browser
  │
  ├── Next.js App Router (`app/`)
  │     ├── page and layout rendering
  │     └── same-origin auth BFF (`/api/auth/*`)
  │
  ├── Frontend application code (`src/`)
  │     └── FSD layers
  │
  └── Nest API and published content roots
```

The Next.js directory owns framework conventions and URLs. `src/` owns product
and application code. This separation prevents Next's reserved `app` and
`pages` directories from conflicting with FSD layer names.

## Static structure

```text
app/                         Next.js framework adapter
src/
  _app/                      FSD App layer
  _pages/                    FSD Pages layer
  widgets/                   Optional FSD Widgets layer
  features/
  entities/
  shared/
```

| Location | Responsibility | Examples |
| --- | --- | --- |
| `app/` | Next route files only; maps URLs to the application | `page.tsx`, `layout.tsx`, `loading.tsx`, `route.ts` |
| `src/_app/` | Application-wide composition and server-side BFF implementation | providers, global styles, `api-routes` |
| `src/_pages/` | A complete screen or a closely related group of screens | login, dashboard, collections, dictation |
| `src/widgets/` | Large self-sufficient UI blocks | application shell |
| `src/features/` | Reusable user interactions | authentication UI, review actions, TOEIC interactions |
| `src/entities/` | Reusable product concepts and their API/model/presentation | collection, vocabulary, dictation, session |
| `src/shared/` | Domain-independent reusable code | UI kit, HTTP client, configuration, routes, i18n |

The deprecated FSD `processes` layer is intentionally not used.

## Next.js route adapters

`app/` must remain thin. A route adapter may:

1. re-export or render a public page from `src/_pages`;
2. read framework route parameters and pass plain values to that page;
3. perform a route-level redirect; or
4. expose a stable Next route handler implemented in `src/_app/api-routes`.

It must not become the permanent home for page UI, client state, data fetching,
or domain logic. New route helpers used only for redirects belong in
`shared/routes`; route adapters should not grow dependencies on feature UI.

Example:

```tsx
// app/dictation/[videoId]/page.tsx
import { DictationStudyPage } from "@/_pages/dictation";

export default async function Page({ params }: { params: Promise<{ videoId: string }> }) {
  const { videoId } = await params;
  return <DictationStudyPage videoId={videoId} />;
}
```

## Dependency rule

FSD dependencies point from a higher layer to a lower layer only:

```text
_app
  └─ _pages
       └─ widgets
            └─ features
                 └─ entities
                      └─ shared
```

More precisely:

| Layer | May import |
| --- | --- |
| `_app` | `_pages`, `widgets`, `features`, `entities`, `shared` |
| `_pages` | `widgets`, `features`, `entities`, `shared` |
| `widgets` | `features`, `entities`, `shared` |
| `features` | `entities`, `shared` |
| `entities` | `shared` |
| `shared` | no FSD layer |

Within a sliced layer (`_pages`, `widgets`, `features`, `entities`), a slice
may use its own files but must not import another slice on the same layer.
`_app` and `shared` are global layers rather than sets of business slices.

## Slices and public APIs

Each externally consumed slice exposes a deliberate public API through its
`index.ts`. Consumers import that entry point, not internal `ui`, `model`,
`api`, or `lib` files.

```ts
// Good: stable public contract
import { LoginPage } from "@/_pages/login";

// Avoid: couples a consumer to the slice's file layout
import { LoginPage } from "@/_pages/login/ui/LoginPage";
```

Do not use blanket `export *` from a slice. Export only the symbols another
layer needs. If two entities genuinely require a type-level cross-import, use
FSD's explicit `@x` public API and keep it exceptional.

## Choosing a layer

Start at the page that owns the behavior.

- Keep code used by one screen in its `_pages` slice.
- Extract a **widget** only for a large independent block, especially when it
  is reused or a page has multiple independent blocks.
- Extract a **feature** for a meaningful, reusable user interaction.
- Extract an **entity** for a reusable product concept.
- Put code in **shared** only when it has no product-domain knowledge.

Folder count is not a quality metric. Do not create a feature, entity, or
widget merely to satisfy a layer name.

## Client and server boundary

App Router slices can contain both client and server modules. Do not expose a
server-only module from a public `index.ts` that a Client Component can import.
When a slice needs both contracts, expose a separate `index.server.ts` for
server-only code.

The same-origin authentication BFF is implemented in
`src/_app/api-routes/auth`; files in `app/api/auth` only preserve the Next.js
route contract. Cookie behavior and public `/api/auth/*` URLs are therefore
independent of internal BFF organization.

```text
login / Google / refresh / logout
Browser → same-origin /api/auth/* → Next.js auth BFF → Ownlish API
                                           │
                                           └─ refresh cookie on the Web origin

authenticated application data
Browser → NEXT_PUBLIC_API_BASE_URL → Ownlish API with in-memory access token
```

The BFF reads the server-only `AUTH_API_BASE_URL`; browser data requests read
`NEXT_PUBLIC_API_BASE_URL`. The BFF owns the refresh cookie, while
`localStorage` holds UI and study preferences only, never access or refresh
tokens. See [CONFIGURATION.md](./CONFIGURATION.md) for the environment
relationship and secret boundary.

## Styling and theme tokens

Tailwind is the primary styling API. `app/layout.tsx` imports exactly one global
stylesheet from `src/_app/styles/globals.css`; it composes the following files:

```text
src/_app/styles/
  globals.css          Tailwind and application-style entrypoint
  tokens.css           light/dark semantic CSS values
  tailwind-theme.css   semantic Tailwind utility mapping
  base.css             global body defaults
  utilities.css        truly global utilities only
```

Use semantic utilities rather than palette names or arbitrary color values:

```tsx
// Good
<section className="rounded-card border border-border bg-surface-card" />
<button className="bg-primary text-primary-foreground" />

// Avoid
<section className="bg-[#f0f0f0] dark:bg-[#272727]" />
<button className="bg-blue-700 text-white" />
```

`background` is the page canvas. `surface` is the existing general raised
surface, `surface-card` is a card/popover surface, and `surface-subtle` is for
selected rows, tracks and table headers. `control-inactive` is reserved for
binary-control tracks. Use `danger`, `success`, `warning` and `information`
for feedback states; do not select a Tailwind palette color directly.

Tailwind's standard spacing and radius scale remains the default. `rounded-card`
is the only application-specific shared geometry token. Feature-specific sizing,
split-panel CSS variables and browser pseudo-element styling stay colocated with
the feature or shared component that owns them.

`pnpm styles:check` rejects raw UI colors in production source and is part of
`pnpm lint`. The documented exceptions are narrow: official social icon colors,
CSS alpha masks, deliberate landing/login/collection artwork, and media-player
rendering controls. Add a new exception only when there is no semantic UI role;
otherwise add or reuse a token.

## Verification

Run these checks before pushing:

```bash
pnpm test
pnpm lint
pnpm build
```

`pnpm lint` runs ESLint for both `src` and root `app`, then runs
`pnpm fsd:check`. Steiger validates FSD layer and public-API rules. Coverage
also includes both `src/**` and root `app/**` so route adapters remain visible
in the report. See [TESTING.md](./TESTING.md) for test levels, local data
requirements, and CI coverage behavior.

## References

- [Feature-Sliced Design: Usage with Next.js](https://fsd.how/docs/guides/tech/with-nextjs/)
- [Feature-Sliced Design: Layers and import rule](https://fsd.how/docs/reference/layers/)
- [Feature-Sliced Design: Public API](https://fsd.how/docs/reference/public-api/)
