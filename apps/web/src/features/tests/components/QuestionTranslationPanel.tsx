import type { ToeicQuestionOptions } from "@/features/tests/api/types";
import { PracticeTranslationCard } from "@/features/tests/components/PracticeTranslationCard";
import type { PartTranslationVariant } from "@/features/tests/lib/partPracticeConfig";

type QuestionTranslationPanelProps = {
  options: ToeicQuestionOptions;
  optionCount: number;
  visible: boolean;
  variant?: PartTranslationVariant;
  questionVi?: string | null;
};

const OPTION_KEYS = ["A", "B", "C", "D"] as const;

export function QuestionTranslationPanel({
  options,
  optionCount,
  visible,
  variant = "options",
  questionVi,
}: QuestionTranslationPanelProps) {
  if (!visible) {
    return null;
  }

  const showQuestion =
    variant === "question-options" || variant === "content-question-options";
  const showOptions =
    variant === "options" ||
    variant === "question-options" ||
    variant === "content-options" ||
    variant === "content-question-options";

  return (
    <PracticeTranslationCard>
      {showQuestion && questionVi?.trim() ? (
        <p className="whitespace-pre-wrap">{questionVi}</p>
      ) : null}
      {showOptions ? (
        <div className="flex flex-col gap-2">
          {OPTION_KEYS.slice(0, optionCount).map((key) => {
            const viKey = `${key}_vi` as keyof ToeicQuestionOptions;
            const label = options[viKey];
            if (!label) {
              return null;
            }

            return (
              <p key={key}>
                {key}. {label}
              </p>
            );
          })}
        </div>
      ) : null}
    </PracticeTranslationCard>
  );
}
