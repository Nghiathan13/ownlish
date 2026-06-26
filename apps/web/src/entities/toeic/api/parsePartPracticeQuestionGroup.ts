import { isNumber, isRecord } from "@/shared/lib/parse";
import { parseToeicQuestionGroup } from "./parseToeicQuestionGroup";
import type { PartPracticeQuestionGroup } from "./types";

export function parsePartPracticeQuestionGroup(
  value: unknown,
): PartPracticeQuestionGroup | null {
  const group = parseToeicQuestionGroup(value);

  if (!group || !isRecord(value)) {
    return null;
  }

  if (
    !isNumber(value.testId) ||
    !isNumber(value.year) ||
    !isNumber(value.testNumber)
  ) {
    return null;
  }

  return {
    ...group,
    testId: value.testId,
    year: value.year,
    testNumber: value.testNumber,
  };
}
