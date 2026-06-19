import type { ReactNode } from "react";
import {
  evidenceQuestionNumberBarClassName,
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
          evidenceQuestionNumberBarClassName,
        )}
      />
      <span
        className={classNames(
          "min-w-0 flex-1",
          evidenceQuestionNumberTextClassName,
          variant === "question" &&
            "whitespace-pre-wrap text-base font-bold leading-relaxed",
        )}
      >
        {children}
      </span>
    </div>
  );
}
