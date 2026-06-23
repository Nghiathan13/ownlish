const TOEIC_PART_COUNT = 7;

function getPracticeIndexStorageKey(testId: number, partNumber: number) {
  return `engvocab.toeicPractice.index.${testId}.${partNumber}`;
}

function getPracticeSessionStorageKey(testId: number, partNumber: number) {
  return `engvocab.toeicPractice.session.${testId}.${partNumber}`;
}

function clearPracticeProgress(testId: number, partNumber: number) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(getPracticeIndexStorageKey(testId, partNumber));
  window.localStorage.removeItem(getPracticeSessionStorageKey(testId, partNumber));
}

export function clearAllPracticeProgressForTest(testId: number) {
  for (let partNumber = 1; partNumber <= TOEIC_PART_COUNT; partNumber += 1) {
    clearPracticeProgress(testId, partNumber);
  }
}
