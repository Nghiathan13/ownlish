# Web scripts

This directory contains local quality and performance tooling. Invoke it
through the named `pnpm` commands in `apps/web/package.json`; that file is the
command source of truth.

```text
scripts/
  quality/                  # Static quality checks and their tests
  lighthouse/               # Lighthouse config, reports, budgets, and auth setup
```

## Quality

`pnpm styles:check` runs `quality/check-semantic-colors.mjs`. The guard is part
of `pnpm lint` and rejects raw UI colors outside the documented exceptions in
`ARCHITECTURE.md`. Its test stays colocated in `quality/`.

## Lighthouse

The files in `lighthouse/` support the `pnpm lighthouse:*` commands. Run the
public, desktop, and authenticated audits only through those commands so their
configured report directories and budget profiles stay consistent. See
[`../TESTING.md`](../TESTING.md) for test and CI behavior.
