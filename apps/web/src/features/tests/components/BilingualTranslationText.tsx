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
        "min-w-0 flex-1 rounded-r-md border-l-[3px] py-1 pl-2 pr-2 select-text",
        statusColorClasses.skyblue.border,
        statusColorClasses.skyblue.background,
        statusColorClasses.skyblue.text,
        variant === "question" &&
          "whitespace-pre-wrap text-base font-bold",
        className,
      )}
    >
      {children}
    </div>
  );
}
