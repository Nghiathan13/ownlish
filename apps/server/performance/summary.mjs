import { readFile } from 'node:fs/promises';
import { formatP95Change } from './baseline-utils.mjs';

const budgets = JSON.parse(
  await readFile(new URL('./budgets.json', import.meta.url), 'utf8'),
);
const metricDefinitions = JSON.parse(
  await readFile(new URL('./metrics.json', import.meta.url), 'utf8'),
);
const profiles = JSON.parse(
  await readFile(new URL('./profiles.json', import.meta.url), 'utf8'),
);
const baseline = JSON.parse(
  await readFile(new URL('./baseline.json', import.meta.url), 'utf8'),
);

function formatDuration(value) {
  return typeof value === 'number' ? `${value.toFixed(2)} ms` : '—';
}

function metricValues(metric) {
  return metric?.values ?? metric;
}

function thresholdStatus(metric) {
  const threshold = Object.values(metric?.thresholds ?? {})[0];

  return threshold?.ok === true
    ? 'pass'
    : threshold?.ok === false
      ? 'fail'
      : '—';
}

function optionValue(name) {
  const index = process.argv.indexOf(name);
  return index === -1 ? undefined : process.argv[index + 1];
}

async function main() {
  const profileName = optionValue('--profile') ?? 'baseline';
  const profile = profiles[profileName];
  const summaryPath =
    optionValue('--summary') ??
    `test-results/performance/k6-${profileName}-summary.json`;

  if (!profile) {
    throw new Error(`Unknown performance profile: ${profileName}`);
  }

  try {
    const summary = JSON.parse(await readFile(summaryPath, 'utf8'));
    const successRate = metricValues(
      summary.metrics.benchmark_request_ok,
    )?.rate;

    console.log(
      `## ${profile.label} API performance (${profile.vus} VUs × ${profile.iterationsPerVu} iterations)`,
    );
    console.log('');
    console.log('| API | Samples | p50 | p95 | Reference | Change | Budget | p99 | Status |');
    console.log('| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |');

    for (const [metricName, definition] of Object.entries(metricDefinitions)) {
      const metric = summary.metrics[metricName];
      const values = metricValues(summary.metrics[metricName]);
      const currentP95 = values?.['p(95)'];
      const referenceP95 = baseline.profiles[profileName]?.p95Ms?.[metricName];
      const budget = profile.enforceBudgets ? budgets[metricName] : undefined;
      const status = profile.enforceBudgets
        ? thresholdStatus(metric)
        : 'observed';
      console.log(
        `| ${definition.label} | ${values?.count ?? '—'} | ${formatDuration(values?.med)} | ${formatDuration(currentP95)} | ${formatDuration(referenceP95)} | ${formatP95Change(currentP95, referenceP95)} | ${budget ? `${budget.p95Ms} ms` : '—'} | ${formatDuration(values?.['p(99)'])} | ${status} |`,
      );
    }

    console.log('');
    console.log(
      `Request success rate: ${typeof successRate === 'number' ? `${(successRate * 100).toFixed(2)}%` : 'unavailable'}`,
    );
  } catch {
    console.log('## API performance');
    console.log('');
    console.log('Performance summary unavailable.');
  }
}

void main();
