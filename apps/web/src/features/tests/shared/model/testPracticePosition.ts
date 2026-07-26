import type { PracticeMode } from "@/entities/toeic-runtime/model/presentation";
import { normalizeSelectedParts } from "@/features/tests/shared/lib/toeicParts";

export function getTestPracticeGroupStorageKey(
  testKey: string,
  mode: PracticeMode,
  selectedParts: number[],
) {
  return `engvocab.practiceRun.group.${testKey}.${mode}.${normalizeSelectedParts(selectedParts).join(",")}`;
}

export function readTestPracticeGroupKey(
  testKey: string | null,
  mode: PracticeMode,
  selectedParts: number[],
) {
  if (typeof window === "undefined" || !testKey) {
    return null;
  }

  return window.localStorage.getItem(
    getTestPracticeGroupStorageKey(testKey, mode, selectedParts),
  );
}

export function writeTestPracticeGroupKey(
  testKey: string | null,
  mode: PracticeMode,
  selectedParts: number[],
  groupKey: string,
) {
  if (typeof window === "undefined" || !testKey) {
    return;
  }

  window.localStorage.setItem(
    getTestPracticeGroupStorageKey(testKey, mode, selectedParts),
    groupKey,
  );
}

export function clearTestPracticeGroupKeys(testKey: string) {
  if (typeof window === "undefined") {
    return;
  }

  const prefix = `engvocab.practiceRun.group.${testKey}.`;
  const keys = Array.from({ length: window.localStorage.length }, (_, index) =>
    window.localStorage.key(index),
  ).filter((key): key is string => key?.startsWith(prefix) ?? false);

  for (const key of keys) {
    window.localStorage.removeItem(key);
  }
}
