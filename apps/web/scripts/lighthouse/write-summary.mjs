import fs from "node:fs";
import path from "node:path";

const reportDirectory = path.resolve(".lighthouseci");
const manifestPath = path.join(reportDirectory, "manifest.json");

const median = (values) => {
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);

  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
};

const formatRange = (values, format) => {
  if (values.length === 0) return "—";

  const minimum = Math.min(...values);
  const maximum = Math.max(...values);
  const center = median(values);

  return minimum === maximum
    ? format(center)
    : `${format(center)} (${format(minimum)}–${format(maximum)})`;
};

const formatScore = (value) => `${Math.round(value * 100)}`;
const formatMilliseconds = (value) => `${Math.round(value)} ms`;
const formatSeconds = (value) => `${(value / 1_000).toFixed(2)} s`;
const formatCls = (value) => value.toFixed(3);

const writeSummary = (content) => {
  if (process.env.GITHUB_STEP_SUMMARY) {
    fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${content}\n`);
    return;
  }

  process.stdout.write(`${content}\n`);
};

if (!fs.existsSync(manifestPath)) {
  writeSummary("## Lighthouse baseline\n\nNo Lighthouse reports were generated.");
  process.exit(0);
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const resultsByRoute = new Map();

for (const entry of manifest) {
  if (!fs.existsSync(entry.jsonPath)) continue;

  const report = JSON.parse(fs.readFileSync(entry.jsonPath, "utf8"));
  const route = new URL(report.finalUrl).pathname || "/";
  const result = {
    performance: report.categories.performance.score,
    accessibility: report.categories.accessibility.score,
    bestPractices: report.categories["best-practices"].score,
    seo: report.categories.seo.score,
    lcp: report.audits["largest-contentful-paint"].numericValue,
    cls: report.audits["cumulative-layout-shift"].numericValue,
    tbt: report.audits["total-blocking-time"].numericValue,
  };

  const results = resultsByRoute.get(route) ?? [];
  results.push(result);
  resultsByRoute.set(route, results);
}

if (resultsByRoute.size === 0) {
  writeSummary("## Lighthouse baseline\n\nNo readable Lighthouse reports were generated.");
  process.exit(0);
}

const rows = [...resultsByRoute.entries()]
  .sort(([left], [right]) => left.localeCompare(right))
  .map(([route, results]) => {
    const values = (key) => results.map((result) => result[key]);

    return [
      `\`${route}\``,
      `${results.length}`,
      formatRange(values("performance"), formatScore),
      formatRange(values("accessibility"), formatScore),
      formatRange(values("bestPractices"), formatScore),
      formatRange(values("seo"), formatScore),
      formatRange(values("lcp"), formatSeconds),
      formatRange(values("cls"), formatCls),
      formatRange(values("tbt"), formatMilliseconds),
    ].join(" | ");
  });

writeSummary(`## Lighthouse baseline

Median with min–max range across each route's runs.

| Route | Runs | Performance | Accessibility | Best Practices | SEO | LCP | CLS | TBT |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| ${rows.join(" |\n| ")} |

Detailed HTML and JSON reports are available in the \`lighthouse-reports\` artifact for 7 days.`);
