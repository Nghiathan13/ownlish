import type {
  ToeicPartProgress,
  ToeicTestSummary,
} from "@/features/tests/api/types";

export function getPartProgress(
  test: ToeicTestSummary | null,
  partNumber: number,
): ToeicPartProgress | null {
  return test?.parts.find((part) => part.partNumber === partNumber) ?? null;
}

export function getTestCorrectCount(test: ToeicTestSummary): number {
  return test.parts.reduce((total, part) => total + part.partCorrectCount, 0);
}

export function getTestWrongCount(test: ToeicTestSummary): number {
  return test.parts.reduce((total, part) => total + part.partWrongCount, 0);
}
