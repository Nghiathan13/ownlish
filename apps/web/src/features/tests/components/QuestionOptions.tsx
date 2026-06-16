import type { ToeicQuestionOptions } from "@/features/tests/api/types";
import { classNames } from "@/shared/lib/classNames";

const OPTION_KEYS = ["A", "B", "C", "D"] as const;

type QuestionOptionsProps = {
  optionCount: number;
  options: ToeicQuestionOptions;
  selectedKey: "A" | "B" | "C" | "D" | null;
  answerKey: "A" | "B" | "C" | "D" | null;
  isAnswered: boolean;
  isSubmitting?: boolean;
  onSelect: (key: "A" | "B" | "C" | "D") => void;
};

function getOptionEnglishText(
  key: (typeof OPTION_KEYS)[number],
  options: ToeicQuestionOptions,
) {
  const text = options[key]?.trim();
  if (!text) {
    return null;
  }

  if (text.toUpperCase() === key) {
    return null;
  }

  return text;
}

export function QuestionOptions({
  optionCount,
  options,
  selectedKey,
  answerKey,
  isAnswered,
  isSubmitting = false,
  onSelect,
}: QuestionOptionsProps) {
  return (
    <div className="grid gap-2">
      {OPTION_KEYS.slice(0, optionCount).map((key) => {
        const isSelected = selectedKey === key;
        const isCorrect = answerKey === key;
        const isWrong = isSelected && answerKey !== null && !isCorrect;
        const englishText = getOptionEnglishText(key, options);

        const className = classNames(
          "min-h-10 rounded-lg border px-3 py-2 text-left text-sm font-medium transition select-text",
          isAnswered && "cursor-text",
          isCorrect && "border-emerald-600 bg-emerald-50 text-emerald-900",
          isWrong && "border-red-600 bg-red-50 text-red-900",
          isAnswered &&
            !isCorrect &&
            !isWrong &&
            "border-border bg-background",
          !isAnswered &&
            !isCorrect &&
            !isWrong &&
            "border-border bg-background hover:bg-muted",
          !isAnswered && isSubmitting && "pointer-events-none opacity-70",
        );

        if (isAnswered) {
          return (
            <div className={className} key={key}>
              <span className="font-semibold">{key}</span>
              {englishText ? (
                <>
                  <span className="font-semibold">.</span> {englishText}
                </>
              ) : null}
            </div>
          );
        }

        return (
          <button
            className={className}
            disabled={isSubmitting}
            key={key}
            onClick={() => onSelect(key)}
            type="button"
          >
            <span className="font-semibold">{key}</span>
          </button>
        );
      })}
    </div>
  );
}
