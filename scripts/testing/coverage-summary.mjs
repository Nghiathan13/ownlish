import { readFile } from 'node:fs/promises';
import path from 'node:path';

const packages = [
  ['Web', 'apps/web/coverage/coverage-summary.json'],
  ['Server', 'apps/server/coverage/coverage-summary.json'],
];

const formatPercent = (value) => `${value.toFixed(2)}%`;

const readSummary = async ([name, relativePath]) => {
  const filePath = path.resolve(process.cwd(), relativePath);

  try {
    const report = JSON.parse(await readFile(filePath, 'utf8')).total;
    return [
      name,
      formatPercent(report.statements.pct),
      formatPercent(report.branches.pct),
      formatPercent(report.functions.pct),
      formatPercent(report.lines.pct),
    ];
  } catch {
    return [name, 'unavailable', 'unavailable', 'unavailable', 'unavailable'];
  }
};

const rows = await Promise.all(packages.map(readSummary));

console.log('## Coverage summary');
console.log();
console.log('| Package | Statements | Branches | Functions | Lines |');
console.log('| --- | ---: | ---: | ---: | ---: |');
for (const row of rows) {
  console.log(`| ${row.join(' | ')} |`);
}
