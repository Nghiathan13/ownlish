import type { ReactNode } from "react";
import {
  evidenceHighlightBackgroundClassName,
  evidenceQuestionNumberTextClassName,
} from "@/features/tests/lib/evidenceHighlightStyles";
import { classNames } from "@/shared/lib/classNames";

type BilingualTranslationTextProps = {
  children: ReactNode;
  className?: string;
  variant?: "question" | "option";
};

export function BilingualTranslationText({
  children,
  className,
  variant = "option",
}: BilingualTranslationTextProps) {
  return (
    <div className={classNames("flex gap-2 select-text", className)}>
      <span
        aria-hidden
        className={classNames(
          "w-0.5 shrink-0 self-stretch rounded-full",
          evidenceHighlightBackgroundClassName,
        )}
      />
      <span
        className={classNames(
          "min-w-0 flex-1",
          variant === "question"
            ? "whitespace-pre-wrap text-base font-bold leading-relaxed"
            : evidenceQuestionNumberTextClassName,
        )}
      >
        {children}
      </span>
    </div>
  );
}
