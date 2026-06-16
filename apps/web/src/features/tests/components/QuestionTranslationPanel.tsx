import type { ToeicQuestionOptions } from "@/features/tests/api/types";
import type { PartTranslationVariant } from "@/features/tests/lib/partPracticeConfig";

type QuestionTranslationPanelProps = {
  options: ToeicQuestionOptions;
  optionCount: number;
  visible: boolean;
  variant?: PartTranslationVariant;
  questionVi?: string | null;
  contentVi?: string | null;
};

const OPTION_KEYS = ["A", "B", "C", "D"] as const;

export function QuestionTranslationPanel({
  options,
  optionCount,
  visible,
  variant = "options",
  questionVi,
  contentVi,
}: QuestionTranslationPanelProps) {
  if (!visible) {
    return null;
  }

  const showContent =
    variant === "content-options" || variant === "content-question-options";
  const showQuestion =
    variant === "question-options" || variant === "content-question-options";
  const showOptions =
    variant === "options" ||
    variant === "question-options" ||
    variant === "content-options" ||
    variant === "content-question-options";

  return (
    <div className="rounded-xl border border-border bg-muted/40 p-4">
      <h3 className="mb-3 text-base font-semibold text-foreground">Translations</h3>
      <div className="space-y-3 text-base text-foreground select-text">
        {showContent && contentVi?.trim() ? (
          <div>
            <p className="mb-1 font-semibold">Passage</p>
            <p className="whitespace-pre-wrap">{contentVi}</p>
          </div>
        ) : null}
        {showQuestion && questionVi?.trim() ? (
          <p>{questionVi}</p>
        ) : null}
        {showOptions ? (
          <div className="space-y-2">
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
    </div>
  );
}
