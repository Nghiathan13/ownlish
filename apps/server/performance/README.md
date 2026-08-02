# API performance baseline

This directory contains a controlled k6 benchmark for EngVocab first-party API flows. It measures backend request duration only; it does not represent browser rendering, Internet latency, or production traffic.

## What it measures

The baseline profile uses 10 virtual users with 20 iterations each. The moderate profile uses 25 virtual users with 20 iterations each. Both measure all 47 deterministic internal routes across these domains:

- Health and password-based authentication
- Vocabulary and collections, including create, update, import, and delete paths
- Oxford reviews, dictation, and learning activity
- TOEIC runtime, including test, part-practice, mock, answer, timer, and completion paths

Google OAuth and avatar upload are intentionally excluded because they depend on external services. The fixture creates ten dedicated users, an A1 Oxford catalog, default collections, vocabulary/progress data, and six months of activity data. Every VU owns its fixture data; each write request uses an iteration-specific resource. `cleanup` deletes only records created by this fixture.

## Run locally

Use a local PostgreSQL database only. The fixture rejects non-loopback database hosts.

Terminal 1:

```bash
set -a
source .env.local
set +a

pnpm build
pnpm performance:grading-index
```

Terminal 2:

```bash
set -a
source .env.local
set +a

export TOEIC_GRADING_INDEX_URL="http://127.0.0.1:3101/grading-index.json"
export AUTH_RATE_LIMIT_LIMIT=1000
export AUTH_RATE_LIMIT_TTL_SECONDS=60
pnpm start:prod
```

Terminal 3:

```bash
set -a
source .env.local
set +a

export PERFORMANCE_DATABASE_URL="$DATABASE_URL"
export PERFORMANCE_BASE_URL="http://127.0.0.1:3001"

pnpm performance:seed:baseline
pnpm performance:run:baseline
pnpm performance:summary -- --profile baseline
pnpm performance:cleanup

pnpm performance:seed:moderate
pnpm performance:run:moderate
pnpm performance:summary -- --profile moderate
pnpm performance:cleanup
```

`performance:run` uses Docker and the pinned `grafana/k6:1.7.1` image. Run cleanup even when the benchmark fails.

## Performance budgets

Each request must succeed. Every measured API has a p95 budget in `budgets.json`, enforced by the baseline profile. The moderate profile only enforces successful requests while its p95 values are observed. The thresholds are based on the maximum p95 from five local benchmark runs, multiplied by 1.5 and rounded up to the next 5 ms.

## Regression baseline

`baseline.json` is the versioned p95 reference for each load profile. It contains the median p95 from five successful controlled runs. The performance summary compares every current p95 with that reference and reports the signed percentage change.

To intentionally refresh one profile's reference, pass exactly five successful k6 summary files:

```bash
pnpm performance:baseline:update -- --profile baseline baseline-run-1.json baseline-run-2.json baseline-run-3.json baseline-run-4.json baseline-run-5.json
```

## Results

The summary reports p50, p95, the versioned reference, percentage change, p99, sample count, budget, and threshold status. k6 exits unsuccessfully when a request fails. The baseline profile also fails when an API exceeds its p95 budget.
