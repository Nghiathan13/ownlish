import { classNames } from "@/shared/lib/classNames";
import { primaryTextButtonClassName, secondaryTextButtonClassName } from "@/shared/ui/button";

type ReviewGradeButtonsProps = {
  disableGood?: boolean;
  disableHard?: boolean;
  disabled: boolean;
  onAgain: () => void;
  onEasy: () => void;
  onGood: () => void;
  onHard: () => void;
};

const gradeButtons = [
  {
    key: "1",
    label: "Again",
    interval: "1m",
    variant: "secondary" as const,
    action: "again" as const,
  },
  {
    key: "2",
    label: "Hard",
    interval: "8h",
    variant: "secondary" as const,
    action: "hard" as const,
  },
  {
    key: "3",
    label: "Good",
    interval: "1d",
    variant: "secondary" as const,
    action: "good" as const,
  },
  {
    key: "4",
    label: "Easy",
    interval: "3d",
    variant: "primary" as const,
    action: "easy" as const,
  },
];

export function ReviewGradeButtons({
  disableGood = false,
  disableHard = false,
  disabled,
  onAgain,
  onEasy,
  onGood,
  onHard,
}: ReviewGradeButtonsProps) {
  const actions = {
    again: onAgain,
    hard: onHard,
    good: onGood,
    easy: onEasy,
  };

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {gradeButtons.map((button) => {
        const isDisabled =
          disabled ||
          (button.action === "hard" && disableHard) ||
          (button.action === "good" && disableGood);
        const className =
          button.variant === "primary"
            ? primaryTextButtonClassName("w-full flex-col gap-1")
            : secondaryTextButtonClassName("w-full flex-col gap-1 hover:bg-hover-overlay");

        return (
          <button
            className={className}
            disabled={isDisabled}
            key={button.key}
            onClick={actions[button.action]}
            type="button"
          >
            <span className="inline-flex items-center gap-1.5">
              <span>{button.label}</span>
              <kbd
                className={classNames(
                  "inline-flex h-5 min-w-5 items-center justify-center rounded border px-1 text-[11px] font-medium",
                  button.variant === "primary"
                    ? "border-background/35 text-background"
                    : "border-border bg-muted text-foreground",
                )}
              >
                {button.key}
              </kbd>
            </span>
            <span
              className={classNames(
                "text-xs font-normal",
                button.variant === "primary"
                  ? "text-background/75"
                  : "text-muted-foreground",
              )}
            >
              {button.interval}
            </span>
          </button>
        );
      })}
    </div>
  );
}
