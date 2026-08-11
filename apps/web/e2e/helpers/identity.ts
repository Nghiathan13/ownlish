import { randomUUID } from "node:crypto";

/** Unique values per test run so isolation is safe under retries. */
export function createRunIdentity(prefix = "playwright") {
  const runId = randomUUID().slice(0, 8);
  return {
    runId,
    email: `${prefix}-${runId}@example.com`,
    word: `e2e-${runId}`,
  };
}
