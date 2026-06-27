import type { PartPracticeConfig, PartTranslationVariant } from "@/features/tests/shared/constants/partPracticeConfig";

export function showsQuestionTranslation(variant: PartTranslationVariant) {
  return (
    variant === "question-options" || variant === "content-question-options"
  );
}

export function showsOptionTranslation(variant: PartTranslationVariant) {
  return (
    variant === "options" ||
    variant === "question-options" ||
    variant === "content-options" ||
    variant === "content-question-options"
  );
}

export function showsGroupContentTranslation(
  partConfig: Pick<PartPracticeConfig, "leftPanel" | "translationVariant">,
) {
  return (
    partConfig.leftPanel === "passage" ||
    partConfig.translationVariant === "content-options" ||
    partConfig.translationVariant === "content-question-options"
  );
}
