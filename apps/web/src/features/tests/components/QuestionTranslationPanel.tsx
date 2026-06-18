import type { ToeicQuestionOptions } from "@/features/tests/api/types";
import { PracticeTranslationCard } from "@/features/tests/components/PracticeTranslationCard";
import { practiceCorrectStatClasses } from "@/features/tests/lib/practiceGradingClasses";
import type { PartTranslationVariant } from "@/features/tests/lib/partPracticeConfig";
import { classNames } from "@/shared/lib/classNames";
import { RightIcon } from "@/shared/ui/icons/RightIcon";

type QuestionTranslationPanelProps = {
  options: ToeicQuestionOptions;
  optionCount: number;
  visible: boolean;
  variant?: PartTranslationVariant;
  questionVi?: string | null;
  answerKey?: "A" | "B" | "C" | "D" | null;
};

const OPTION_KEYS = ["A", "B", "C", "D"] as const;

export function QuestionTranslationPanel({
  options,
  optionCount,
  visible,
  variant = "options",
  questionVi,
  answerKey = null,
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
        <p className="font-semibold whitespace-pre-wrap">{questionVi}</p>
      ) : null}
      {showOptions
        ? OPTION_KEYS.slice(0, optionCount).map((key) => {
            const viKey = `${key}_vi` as keyof ToeicQuestionOptions;
            const label = options[viKey];
            if (!label) {
              return null;
            }

            const isCorrect = answerKey === key;

            return (
              <p
                className={classNames(
                  "flex items-center gap-2",
                  isCorrect && practiceCorrectStatClasses,
                )}
                key={key}
              >
                {isCorrect ? (
                  <RightIcon
                    className={classNames(
                      practiceCorrectStatClasses,
                      "-translate-y-[0.5px]",
                    )}
                  />
                ) : null}
                {key}. {label}
              </p>
            );
          })
        : null}
    </PracticeTranslationCard>
  );
}
