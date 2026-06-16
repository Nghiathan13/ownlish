import type { ToeicQuestionOptions } from "@/features/tests/api/types";

type QuestionTranslationPanelProps = {
  options: ToeicQuestionOptions;
  optionCount: number;
};

const OPTION_KEYS = ["A", "B", "C", "D"] as const;

export function QuestionTranslationPanel({
  options,
  optionCount,
}: QuestionTranslationPanelProps) {
  return (
    <div className="rounded-xl border border-border bg-muted/40 p-4">
      <h3 className="mb-3 text-sm font-semibold">Dịch nghĩa các đáp án</h3>
      <div className="space-y-2 text-sm text-muted-foreground">
        {OPTION_KEYS.slice(0, optionCount).map((key) => {
          const viKey = `${key}_vi` as keyof ToeicQuestionOptions;
          const label = options[viKey];
          if (!label) {
            return null;
          }

          return (
            <p key={key}>
              <span className="font-semibold text-foreground">{key}.</span>{" "}
              {label}
            </p>
          );
        })}
      </div>
    </div>
  );
}
