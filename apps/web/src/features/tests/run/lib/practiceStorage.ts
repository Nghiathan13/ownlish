export function getPracticeIndexStorageKey(testId: number, partNumber: number) {
  return `engvocab.toeicPractice.index.${testId}.${partNumber}`;
}

export function getPracticeSessionStorageKey(testId: number, partNumber: number) {
  return `engvocab.toeicPractice.session.${testId}.${partNumber}`;
}

export function readPracticeIndex(testId: number, partNumber: number) {
  if (typeof window === "undefined") {
    return 0;
  }

  const raw = window.localStorage.getItem(
    getPracticeIndexStorageKey(testId, partNumber),
  );
  const parsed = raw ? Number.parseInt(raw, 10) : 0;

  return Number.isInteger(parsed) && parsed >= 0 ? parsed : 0;
}

export function writePracticeIndex(
  testId: number,
  partNumber: number,
  index: number,
) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    getPracticeIndexStorageKey(testId, partNumber),
    String(index),
  );
}

export function syncPracticeProgressSession(
  testId: number,
  partNumber: number,
  sessionId: string,
) {
  if (typeof window === "undefined") {
    return readPracticeIndex(testId, partNumber);
  }

  const sessionKey = getPracticeSessionStorageKey(testId, partNumber);
  const savedSessionId = window.localStorage.getItem(sessionKey);

  if (savedSessionId !== sessionId) {
    window.localStorage.setItem(sessionKey, sessionId);
    writePracticeIndex(testId, partNumber, 0);
    return 0;
  }

  return readPracticeIndex(testId, partNumber);
}

export function clearPracticeProgress(testId: number, partNumber: number) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(getPracticeIndexStorageKey(testId, partNumber));
  window.localStorage.removeItem(getPracticeSessionStorageKey(testId, partNumber));
}

const TOEIC_PART_COUNT = 7;

export function clearAllPracticeProgressForTest(testId: number) {
  for (let partNumber = 1; partNumber <= TOEIC_PART_COUNT; partNumber += 1) {
    clearPracticeProgress(testId, partNumber);
  }
}
