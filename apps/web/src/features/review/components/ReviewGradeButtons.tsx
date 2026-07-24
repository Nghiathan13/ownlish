"use client";

import type { MessageKey } from "@/shared/i18n/messages";
import { classNames } from "@/shared/lib/classNames";
import { useT } from "@/shared/providers/LocaleProvider";
import { textButtonClassName } from "@/shared/ui/button";

type ReviewGradeButtonsProps = {
  disableGood?: boolean;
  disableHard?: boolean;
  disabled: boolean;
  onAgain: () => void;
  onEasy: () => void;
  onGood: () => void;
  onHard: () => void;
};

const gradeButtons: Array<{
  key: string;
  labelKey: MessageKey;
  interval: string;
  action: "again" | "hard" | "good" | "easy";
  textClassName: string;
  backgroundClassName: string;
  borderClassName: string;
}> = [
  {
    key: "1",
    labelKey: "review.again",
    interval: "1m",
    action: "again",
    textClassName: "text-danger",
    backgroundClassName: "bg-danger-background",
    borderClassName: "border-danger-border",
  },
  {
    key: "2",
    labelKey: "review.hard",
    interval: "8h",
    action: "hard",
    textClassName: "text-warning",
    backgroundClassName: "bg-warning-background",
    borderClassName: "border-warning-border",
  },
  {
    key: "3",
    labelKey: "review.good",
    interval: "1d",
    action: "good",
    textClassName: "text-success",
    backgroundClassName: "bg-success-background",
    borderClassName: "border-success-border",
  },
  {
    key: "4",
    labelKey: "review.easy",
    interval: "3d",
    action: "easy",
    textClassName: "text-information",
    backgroundClassName: "bg-information-background",
    borderClassName: "border-information-border",
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
  const t = useT();
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

        return (
          <button
            className={textButtonClassName(
              "w-full flex-col gap-1",
              button.textClassName,
              button.backgroundClassName,
              button.borderClassName,
              "hover:[box-shadow:inset_0_0_0_9999px_var(--hover-overlay)]",
            )}
            disabled={isDisabled}
            key={button.key}
            onClick={actions[button.action]}
            type="button"
          >
            <span className="inline-flex items-center gap-1.5">
              <span>{t(button.labelKey)}</span>
              <kbd
                className={classNames(
                  "inline-flex h-5 min-w-5 items-center justify-center rounded border px-1 text-[11px] font-medium",
                  button.backgroundClassName,
                  button.borderClassName,
                )}
              >
                {button.key}
              </kbd>
            </span>
            <span className="text-xs font-normal opacity-80">{button.interval}</span>
          </button>
        );
      })}
    </div>
  );
}
