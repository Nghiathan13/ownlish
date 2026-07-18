import type {
  CatalogTestPartProgress,
  CatalogTestSummary,
} from "@/features/tests/shared/model/catalogTestSummary";

export function getPartProgress(
  test: CatalogTestSummary | null,
  partNumber: number,
): CatalogTestPartProgress | null {
  return test?.parts.find((part) => part.partNumber === partNumber) ?? null;
}

export function getTestCorrectCount(test: CatalogTestSummary): number {
  return test.parts.reduce((total, part) => total + part.partCorrectCount, 0);
}

export function getTestWrongCount(test: CatalogTestSummary): number {
  return test.parts.reduce((total, part) => total + part.partWrongCount, 0);
}
