import fs from "node:fs";
import { median, readResultsByRoute } from "./reports.mjs";

const option = (name, fallback) => {
  const index = process.argv.indexOf(name);

  return index === -1 ? fallback : process.argv[index + 1];
};

const reportDirectory = option("--report-directory", ".lighthouseci");
const profile = option("--profile", "mobile");

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

const resultsByRoute = readResultsByRoute(reportDirectory);

const heading = profile === "mobile" ? "Lighthouse baseline" : `Lighthouse ${profile} baseline`;
const artifactName = profile === "desktop" ? "lighthouse-desktop-reports" : "lighthouse-reports";

if (resultsByRoute.size === 0) {
  writeSummary(`## ${heading}\n\nNo readable Lighthouse reports were generated.`);
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

writeSummary(`## ${heading}

Median with min–max range across each route's runs.

| Route | Runs | Performance | Accessibility | Best Practices | SEO | LCP | CLS | TBT |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| ${rows.join(" |\n| ")} |

Detailed HTML and JSON reports are available in the \`${artifactName}\` artifact for 7 days.`);
