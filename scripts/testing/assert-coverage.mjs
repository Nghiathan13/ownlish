import { readFile } from 'node:fs/promises';
import path from 'node:path';

const thresholds = {
  statements: 90,
  branches: 80,
  functions: 90,
  lines: 90,
};
const packages = [
  ['Web', 'apps/web/coverage/coverage-summary.json'],
  ['Server', 'apps/server/coverage/coverage-summary.json'],
];

let failed = false;

for (const [name, relativePath] of packages) {
  const filePath = path.resolve(process.cwd(), relativePath);
  const report = JSON.parse(await readFile(filePath, 'utf8')).total;

  for (const [metric, threshold] of Object.entries(thresholds)) {
    const actual = report[metric].pct;
    if (actual < threshold) {
      console.error(`${name} ${metric}: ${actual}% is below ${threshold}%`);
      failed = true;
    }
  }
}

if (failed) {
  process.exitCode = 1;
}
