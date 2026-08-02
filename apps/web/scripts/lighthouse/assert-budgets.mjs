import { median, readResultsByRoute } from "./reports.mjs";

const RUNS_PER_ROUTE = 3;
const budgets = {
  "/": {
    performance: { min: 0.85 },
    accessibility: { min: 0.98 },
    bestPractices: { min: 0.95 },
    seo: { min: 0.98 },
    lcp: { max: 4_300 },
    cls: { max: 0.05 },
    tbt: { max: 175 },
  },
  "/login": {
    performance: { min: 0.89 },
    accessibility: { min: 0.98 },
    bestPractices: { min: 0.95 },
    seo: { min: 0.98 },
    lcp: { max: 3_800 },
    cls: { max: 0.05 },
    tbt: { max: 200 },
  },
};

const format = {
  performance: (value) => `${Math.round(value * 100)}`,
  accessibility: (value) => `${Math.round(value * 100)}`,
  bestPractices: (value) => `${Math.round(value * 100)}`,
  seo: (value) => `${Math.round(value * 100)}`,
  lcp: (value) => `${Math.round(value)} ms`,
  cls: (value) => value.toFixed(3),
  tbt: (value) => `${Math.round(value)} ms`,
};

const resultsByRoute = readResultsByRoute();
const failures = [];

for (const [route, routeBudgets] of Object.entries(budgets)) {
  const results = resultsByRoute.get(route) ?? [];

  if (results.length !== RUNS_PER_ROUTE) {
    failures.push(`${route}: expected ${RUNS_PER_ROUTE} reports, found ${results.length}`);
    continue;
  }

  for (const [metric, limit] of Object.entries(routeBudgets)) {
    const value = median(results.map((result) => result[metric]));

    if (limit.min !== undefined && value < limit.min) {
      failures.push(
        `${route} ${metric}: median ${format[metric](value)} is below ${format[metric](limit.min)}`,
      );
    }

    if (limit.max !== undefined && value > limit.max) {
      failures.push(
        `${route} ${metric}: median ${format[metric](value)} exceeds ${format[metric](limit.max)}`,
      );
    }
  }
}

if (failures.length > 0) {
  console.error("Lighthouse budget failures:\n- " + failures.join("\n- "));
  process.exit(1);
}

console.log("Lighthouse median budgets passed.");
