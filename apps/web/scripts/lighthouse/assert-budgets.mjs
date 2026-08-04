import { median, readResultsByRoute } from "./reports.mjs";

const RUNS_PER_ROUTE = 3;
const authenticatedCategoryBudgets = {
  accessibility: { min: 0.98 },
  bestPractices: { min: 0.95 },
  seo: { min: 0.98 },
};
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
  authenticated: {
    reportDirectory: ".lighthouseci-authenticated",
    budgets: {
      "/dashboard/my-activity": { ...authenticatedCategoryBudgets, lcp: { max: 5_300 }, cls: { max: 0.05 }, tbt: { max: 225 } },
      "/dashboard/progress": { ...authenticatedCategoryBudgets, lcp: { max: 5_300 }, cls: { max: 0.05 }, tbt: { max: 225 } },
      "/collections/user": { ...authenticatedCategoryBudgets, lcp: { max: 4_500 }, cls: { max: 0.05 }, tbt: { max: 125 } },
      "/collections/user/20000000-0000-4000-8000-000000000001": { ...authenticatedCategoryBudgets, lcp: { max: 5_300 }, cls: { max: 0.05 }, tbt: { max: 200 } },
      "/collections/oxford/A1": { ...authenticatedCategoryBudgets, lcp: { max: 4_900 }, cls: { max: 0.05 }, tbt: { max: 200 } },
      "/collections/oxford/A1/part-1": { ...authenticatedCategoryBudgets, lcp: { max: 5_300 }, cls: { max: 0.05 }, tbt: { max: 250 } },
      "/review": { ...authenticatedCategoryBudgets, lcp: { max: 4_500 }, cls: { max: 0.05 }, tbt: { max: 175 } },
      "/review/oxford/A1/part-1": { ...authenticatedCategoryBudgets, lcp: { max: 5_100 }, cls: { max: 0.05 }, tbt: { max: 200 } },
      "/tests?tab=mock_tests&year=2019": { ...authenticatedCategoryBudgets, lcp: { max: 4_300 }, cls: { max: 0.05 }, tbt: { max: 125 } },
      "/tests?tab=part_practice&part=1": { ...authenticatedCategoryBudgets, lcp: { max: 4_400 }, cls: { max: 0.05 }, tbt: { max: 175 } },
      "/dictation": { ...authenticatedCategoryBudgets, lcp: { max: 4_100 }, cls: { max: 0.05 }, tbt: { max: 175 } },
      "/dictation/music": { ...authenticatedCategoryBudgets, lcp: { max: 4_100 }, cls: { max: 0.05 }, tbt: { max: 175 } },
      "/dictation/bbc": { ...authenticatedCategoryBudgets, lcp: { max: 4_100 }, cls: { max: 0.05 }, tbt: { max: 175 } },
    },
  },
  "authenticated-desktop": {
    reportDirectory: ".lighthouseci-authenticated-desktop",
    budgets: {
      "/dashboard/my-activity": { ...authenticatedCategoryBudgets, lcp: { max: 1_200 }, cls: { max: 0.08 }, tbt: { max: 50 } },
      "/dashboard/progress": { ...authenticatedCategoryBudgets, lcp: { max: 1_200 }, cls: { max: 0.08 }, tbt: { max: 50 } },
      "/collections/user": { ...authenticatedCategoryBudgets, lcp: { max: 1_100 }, cls: { max: 0.05 }, tbt: { max: 50 } },
      "/collections/user/20000000-0000-4000-8000-000000000001": { ...authenticatedCategoryBudgets, lcp: { max: 1_200 }, cls: { max: 0.05 }, tbt: { max: 50 } },
      "/collections/oxford/A1": { ...authenticatedCategoryBudgets, lcp: { max: 1_100 }, cls: { max: 0.05 }, tbt: { max: 50 } },
      "/collections/oxford/A1/part-1": { ...authenticatedCategoryBudgets, lcp: { max: 1_200 }, cls: { max: 0.05 }, tbt: { max: 50 } },
      "/review": { ...authenticatedCategoryBudgets, lcp: { max: 1_200 }, cls: { max: 0.05 }, tbt: { max: 50 } },
      "/review/oxford/A1/part-1": { ...authenticatedCategoryBudgets, lcp: { max: 1_200 }, cls: { max: 0.05 }, tbt: { max: 50 } },
      "/tests?tab=mock_tests&year=2019": { ...authenticatedCategoryBudgets, lcp: { max: 1_000 }, cls: { max: 0.05 }, tbt: { max: 50 } },
      "/tests?tab=part_practice&part=1": { ...authenticatedCategoryBudgets, lcp: { max: 1_000 }, cls: { max: 0.05 }, tbt: { max: 50 } },
      "/dictation": { ...authenticatedCategoryBudgets, lcp: { max: 1_100 }, cls: { max: 0.05 }, tbt: { max: 50 } },
      "/dictation/music": { ...authenticatedCategoryBudgets, lcp: { max: 1_000 }, cls: { max: 0.05 }, tbt: { max: 50 } },
      "/dictation/bbc": { ...authenticatedCategoryBudgets, lcp: { max: 1_100 }, cls: { max: 0.05 }, tbt: { max: 50 } },
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
