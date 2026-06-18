export function getFullTestIndexStorageKey(attemptId: string) {
  return `engvocab.fullTest.index.${attemptId}`;
}

export function readFullTestIndex(attemptId: string) {
  if (typeof window === "undefined") {
    return 0;
  }

  const raw = window.localStorage.getItem(getFullTestIndexStorageKey(attemptId));
  const parsed = raw ? Number.parseInt(raw, 10) : 0;

  return Number.isInteger(parsed) && parsed >= 0 ? parsed : 0;
}

export function writeFullTestIndex(attemptId: string, index: number) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(getFullTestIndexStorageKey(attemptId), String(index));
}
