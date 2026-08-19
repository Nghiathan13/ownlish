import type { ReactNode } from "react";
import { classNames } from "@/shared/lib/classNames";

type BilingualTranslationTextProps = {
  children: ReactNode;
  className?: string;
  plain?: boolean;
  variant?: "question" | "option";
};

export function BilingualTranslationText({
  children,
  className,
  plain = false,
  variant = "option",
}: BilingualTranslationTextProps) {
  if (plain) {
    return (
      <div
        className={classNames(
          "whitespace-pre-wrap text-muted-foreground select-text",
          variant === "question" ? "text-base font-bold" : "text-base",
          className,
        )}
      >
        {children}
      </div>
    );
  }

  return (
    <div
      className={classNames(
        "w-fit max-w-full self-start rounded-r-md border-l-[3px] border-primary bg-primary/5 py-1 pl-2 pr-2 text-primary select-text dark:bg-primary/5",
        variant === "question" &&
          "whitespace-pre-wrap text-base font-bold",
        className,
      )}
    >
      {children}
    </div>
  );
}
