import { median, readResultsByRoute } from "./reports.mjs";

const RUNS_PER_ROUTE = 3;
const profiles = {
  mobile: {
    reportDirectory: ".lighthouseci",
    budgets: {
      "/": {
        accessibility: { min: 0.98 },
        bestPractices: { min: 0.95 },
        seo: { min: 0.98 },
        lcp: { max: 4_300 },
        cls: { max: 0.05 },
        tbt: { max: 175 },
      },
      "/login": {
        accessibility: { min: 0.98 },
        bestPractices: { min: 0.95 },
        seo: { min: 0.98 },
        lcp: { max: 3_800 },
        cls: { max: 0.05 },
        tbt: { max: 200 },
      },
    },
  },
  desktop: {
    reportDirectory: ".lighthouseci-desktop",
    budgets: {
      "/": {
        accessibility: { min: 0.98 },
        bestPractices: { min: 0.95 },
        seo: { min: 0.98 },
        lcp: { max: 1_000 },
        cls: { max: 0.05 },
        tbt: { max: 50 },
      },
      "/login": {
        accessibility: { min: 0.98 },
        bestPractices: { min: 0.95 },
        seo: { min: 0.98 },
        lcp: { max: 900 },
        cls: { max: 0.05 },
        tbt: { max: 50 },
      },
    },
  },
};

const option = (name, fallback) => {
  const index = process.argv.indexOf(name);

  return index === -1 ? fallback : process.argv[index + 1];
};

const profileName = option("--profile", "mobile");
const profile = profiles[profileName];

if (!profile) {
  throw new Error(`Unknown Lighthouse profile: ${profileName}`);
}

const reportDirectory = option("--report-directory", profile.reportDirectory);

const format = {
  performance: (value) => `${Math.round(value * 100)}`,
  accessibility: (value) => `${Math.round(value * 100)}`,
  bestPractices: (value) => `${Math.round(value * 100)}`,
  seo: (value) => `${Math.round(value * 100)}`,
  lcp: (value) => `${Math.round(value)} ms`,
  cls: (value) => value.toFixed(3),
  tbt: (value) => `${Math.round(value)} ms`,
};

const resultsByRoute = readResultsByRoute(reportDirectory);
const failures = [];

for (const [route, routeBudgets] of Object.entries(profile.budgets)) {
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

console.log(`Lighthouse ${profileName} median budgets passed.`);
