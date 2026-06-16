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
        const label = isAnswered ? options[key] : null;

        const className = classNames(
          "rounded-lg border px-3 py-2 text-left text-sm font-medium transition select-text",
          isAnswered && "cursor-text",
          isCorrect && "border-emerald-600 bg-emerald-50 text-emerald-900",
          isWrong && "border-red-600 bg-red-50 text-red-900",
          !isAnswered &&
            !isCorrect &&
            !isWrong &&
            "border-border bg-background hover:bg-muted",
          !isAnswered && isSubmitting && "pointer-events-none opacity-70",
        );

        if (isAnswered) {
          return (
            <div className={className} key={key}>
              <span className="font-semibold">{key}.</span>{" "}
              {label ?? key}
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
            <span className="font-semibold">{key}.</span> {key}
          </button>
        );
      })}
    </div>
  );
}
