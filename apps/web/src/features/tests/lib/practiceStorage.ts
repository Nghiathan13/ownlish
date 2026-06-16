export function getPracticeIndexStorageKey(testId: number, partNumber: number) {
  return `engvocab.toeicPractice.index.${testId}.${partNumber}`;
}

export function getPracticeSessionStorageKey(testId: number, partNumber: number) {
  return `engvocab.toeicPractice.session.${testId}.${partNumber}`;
}

export function getPracticePendingSelectionsKey(sessionId: string) {
  return `engvocab.toeicPractice.pending.${sessionId}`;
}

type OptionKey = "A" | "B" | "C" | "D";

export type PendingSelectionsByGroup = Record<number, Record<number, OptionKey>>;

export function readPendingSelections(
  sessionId: string,
): PendingSelectionsByGroup {
  if (typeof window === "undefined") {
    return {};
  }

  const raw = window.localStorage.getItem(
    getPracticePendingSelectionsKey(sessionId),
  );
  if (!raw) {
    return {};
  }

  try {
    const parsed = JSON.parse(raw) as Record<string, Record<string, string>>;
    const result: PendingSelectionsByGroup = {};

    for (const [groupId, questions] of Object.entries(parsed)) {
      const numericGroupId = Number.parseInt(groupId, 10);
      if (!Number.isInteger(numericGroupId)) {
        continue;
      }

      result[numericGroupId] = {};
      for (const [questionId, selectedKey] of Object.entries(questions)) {
        const numericQuestionId = Number.parseInt(questionId, 10);
        if (
          Number.isInteger(numericQuestionId) &&
          (selectedKey === "A" ||
            selectedKey === "B" ||
            selectedKey === "C" ||
            selectedKey === "D")
        ) {
          result[numericGroupId][numericQuestionId] = selectedKey;
        }
      }
    }

    return result;
  } catch {
    return {};
  }
}

export function writePendingSelections(
  sessionId: string,
  selections: PendingSelectionsByGroup,
) {
  if (typeof window === "undefined") {
    return;
  }

  const serialized: Record<string, Record<string, string>> = {};
  for (const [groupId, questions] of Object.entries(selections)) {
    serialized[groupId] = questions;
  }

  window.localStorage.setItem(
    getPracticePendingSelectionsKey(sessionId),
    JSON.stringify(serialized),
  );
}

export function clearPendingSelections(sessionId: string) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(getPracticePendingSelectionsKey(sessionId));
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
    if (savedSessionId) {
      clearPendingSelections(savedSessionId);
    }

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
