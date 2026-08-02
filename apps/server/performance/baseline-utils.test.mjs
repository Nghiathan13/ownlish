import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createProfileBaseline,
  formatP95Change,
} from './baseline-utils.mjs';

function summary(p95, successRate = 1) {
  return {
    metrics: {
      benchmark_request_ok: { values: { rate: successRate } },
      api_health_duration: { values: { 'p(95)': p95 } },
    },
  };
}

test('uses the median p95 from five successful summaries', () => {
  assert.deepEqual(
    createProfileBaseline(['api_health_duration'], [
      summary(30),
      summary(10),
      summary(20),
      summary(50),
      summary(40),
    ]),
    { api_health_duration: 30 },
  );
});

test('rejects incomplete or unsuccessful baseline inputs', () => {
  assert.throws(
    () => createProfileBaseline(['api_health_duration'], [summary(10)]),
    /Exactly five/,
  );
  assert.throws(
    () =>
      createProfileBaseline(['api_health_duration'], [
        summary(10),
        summary(10),
        summary(10),
        summary(10),
        summary(10, 0.99),
      ]),
    /100%/,
  );
  assert.throws(
    () =>
      createProfileBaseline(['api_missing_duration'], [
        summary(10),
        summary(10),
        summary(10),
        summary(10),
        summary(10),
      ]),
    /Missing p95/,
  );
});

test('formats p95 changes with a signed percentage', () => {
  assert.equal(formatP95Change(12, 10), '+20.0%');
  assert.equal(formatP95Change(8, 10), '-20.0%');
  assert.equal(formatP95Change(undefined, 10), '—');
});
