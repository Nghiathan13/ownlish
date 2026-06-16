import type { ToeicQuestionOptions } from "@/features/tests/api/types";
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
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-muted/40 p-4 text-base text-foreground select-text">
      <p className="font-semibold">Translations</p>
      {showQuestion && questionVi?.trim() ? <p>{questionVi}</p> : null}
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
    </div>
  );
}
