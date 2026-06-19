export function getPracticeRunIndexStorageKey(sessionId: string) {
  return `engvocab.practiceRun.index.${sessionId}`;
}

export function readPracticeRunIndex(sessionId: string) {
  if (typeof window === "undefined") {
    return 0;
  }

  const raw = window.localStorage.getItem(getPracticeRunIndexStorageKey(sessionId));
  const parsed = raw ? Number.parseInt(raw, 10) : 0;

  return Number.isInteger(parsed) && parsed >= 0 ? parsed : 0;
}

export function writePracticeRunIndex(sessionId: string, index: number) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(getPracticeRunIndexStorageKey(sessionId), String(index));
}
