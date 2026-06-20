import { isSupportedPracticePart } from "@/features/tests/shared/lib/partPracticeConfig";

export const LISTENING_PARTS = [1, 2, 3, 4] as const;
export const READING_PARTS = [5, 6, 7] as const;

export function isPartEnabled(partNumber: number) {
  return isSupportedPracticePart(partNumber);
}

export function addPartToSelection(current: number[], partNumber: number) {
  if (current.includes(partNumber)) {
    return current;
  }

  return [...current, partNumber];
}

export function removePartFromSelection(
  current: number[],
  partNumber: number,
) {
  return current.filter((part) => part !== partNumber);
}
