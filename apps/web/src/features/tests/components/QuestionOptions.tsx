import { classNames } from "@/shared/lib/classNames";

const OPTION_KEYS = ["A", "B", "C", "D"] as const;

type QuestionOptionsProps = {
  optionCount: number;
  selectedKey: "A" | "B" | "C" | "D" | null;
  revealedEnglish: Partial<Record<"A" | "B" | "C" | "D", string | null>>;
  answerKey: "A" | "B" | "C" | "D" | null;
  disabled?: boolean;
  onSelect: (key: "A" | "B" | "C" | "D") => void;
};

export function QuestionOptions({
  optionCount,
  selectedKey,
  revealedEnglish,
  answerKey,
  disabled = false,
  onSelect,
}: QuestionOptionsProps) {
  return (
    <div className="grid gap-2">
      {OPTION_KEYS.slice(0, optionCount).map((key) => {
        const isSelected = selectedKey === key;
        const isCorrect = answerKey === key;
        const isWrong = isSelected && answerKey !== null && !isCorrect;
        const english = revealedEnglish[key];

        return (
          <button
            className={classNames(
              "rounded-lg border px-3 py-2 text-left text-sm font-medium transition",
              isCorrect && "border-emerald-600 bg-emerald-50 text-emerald-900",
              isWrong && "border-red-600 bg-red-50 text-red-900",
              !isCorrect &&
                !isWrong &&
                "border-border bg-background hover:bg-muted",
              disabled && "cursor-not-allowed opacity-70",
            )}
            disabled={disabled}
            key={key}
            onClick={() => onSelect(key)}
            type="button"
          >
            <span className="font-semibold">{key}.</span>{" "}
            {english ? english : key}
          </button>
        );
      })}
    </div>
  );
}
