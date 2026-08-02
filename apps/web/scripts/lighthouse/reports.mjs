import fs from "node:fs";
import path from "node:path";

export const median = (values) => {
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);

  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
};

export const readResultsByRoute = (reportDirectory = ".lighthouseci") => {
  const manifestPath = path.resolve(reportDirectory, "manifest.json");

  if (!fs.existsSync(manifestPath)) return new Map();

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

  return resultsByRoute;
};
