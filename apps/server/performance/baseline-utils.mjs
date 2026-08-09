function metricValues(metric) {
  return metric?.values ?? metric;
}

function p95(summary, metricName) {
  const value = metricValues(summary.metrics?.[metricName])?.['p(95)'];

  if (typeof value !== 'number') {
    throw new Error(`Missing p95 for ${metricName}`);
  }

  return value;
}

function assertSuccessful(summary) {
  const successRate = metricValues(summary.metrics?.benchmark_request_ok)?.rate;

  if (successRate !== 1) {
    throw new Error('A baseline summary must have a 100% request success rate');
  }
}

export function createProfileBaseline(metricNames, summaries) {
  if (summaries.length !== 5) {
    throw new Error('Exactly five successful summary files are required');
  }

  summaries.forEach(assertSuccessful);

  return Object.fromEntries(
    metricNames.map((metricName) => {
      const values = summaries
        .map((summary) => p95(summary, metricName))
        .sort((left, right) => left - right);

      return [metricName, values[2]];
    }),
  );
}

export function formatP95Change(currentP95, referenceP95) {
  if (typeof currentP95 !== 'number' || typeof referenceP95 !== 'number') {
    return '—';
  }

  const change = ((currentP95 - referenceP95) / referenceP95) * 100;
  return `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`;
}
