import {
  PART_PRACTICE_CONFIG,
  type PartPracticeConfig,
} from "@/features/tests/shared/constants/partPracticeConfig";

export function getPartPracticeConfig(partNumber: number): PartPracticeConfig {
  return (
    PART_PRACTICE_CONFIG[partNumber] ?? {
      leftPanel: "question",
      translationVariant: "question-options",
      showQuestionInRightPanel: true,
      navigationMode: "per-question",
      showOptionTextBeforeAnswer: false,
      hideContextUntilGroupComplete: false,
      contentLayout: "default",
    }
  );
}

export function isSupportedPracticePart(partNumber: number) {
  return partNumber >= 1 && partNumber <= 7;
}
