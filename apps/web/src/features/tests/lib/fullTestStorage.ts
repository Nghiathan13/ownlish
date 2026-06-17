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

export function getFullTestSelectedPartsStorageKey(attemptId: string) {
  return `engvocab.fullTest.parts.${attemptId}`;
}

export function readFullTestSelectedParts(attemptId: string) {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(
    getFullTestSelectedPartsStorageKey(attemptId),
  );

  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return null;
    }

    return parsed.filter((value): value is number => typeof value === "number");
  } catch {
    return null;
  }
}

export function writeFullTestSelectedParts(attemptId: string, parts: number[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    getFullTestSelectedPartsStorageKey(attemptId),
    JSON.stringify(parts),
  );
}
