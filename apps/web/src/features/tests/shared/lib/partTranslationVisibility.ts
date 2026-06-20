import type { PartTranslationVariant } from "@/features/tests/shared/lib/partPracticeConfig";

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
