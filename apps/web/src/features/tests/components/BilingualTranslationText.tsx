import type { ReactNode } from "react";
import { classNames } from "@/shared/lib/classNames";
import { statusColorClasses } from "@/shared/ui/theme/statusColors";

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
    <div
      className={classNames(
        "min-w-0 flex-1 border-l-2 pl-2 select-text",
        statusColorClasses.amber.border,
        statusColorClasses.amber.text,
        variant === "question" &&
          "whitespace-pre-wrap text-base font-bold leading-relaxed",
        className,
      )}
    >
      {children}
    </div>
  );
}
