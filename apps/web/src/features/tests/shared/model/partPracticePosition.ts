import type { PracticeMode } from "@/entities/toeic/api/types";

export function getPartPracticePositionStorageKey(
  partNumber: number,
  mode: PracticeMode,
) {
  return `engvocab:part-practice:${mode}:part:${partNumber}`;
}

export function readPartPracticeGroupKey(
  partNumber: number,
  mode: PracticeMode,
) {
  return window.localStorage.getItem(
    getPartPracticePositionStorageKey(partNumber, mode),
  );
}

export function writePartPracticeGroupKey(
  partNumber: number,
  mode: PracticeMode,
  groupKey: string,
) {
  window.localStorage.setItem(
    getPartPracticePositionStorageKey(partNumber, mode),
    groupKey,
  );
}

export function clearPartPracticeGroupKeys(partNumber: number) {
  window.localStorage.removeItem(
    getPartPracticePositionStorageKey(partNumber, "practice"),
  );
  window.localStorage.removeItem(
    getPartPracticePositionStorageKey(partNumber, "review_wrong"),
  );
}
