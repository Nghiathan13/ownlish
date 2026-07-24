import type { InputHTMLAttributes } from "react";
import { classNames } from "@/shared/lib/classNames";

type TextInputProps = InputHTMLAttributes<HTMLInputElement>;

export function TextInput({ className, ...props }: TextInputProps) {
  return (
    <input
      className={classNames(
        "rounded-lg border border-border bg-transparent px-3 py-2.5 text-foreground outline-none placeholder:text-muted-foreground focus:border-foreground",
        className,
      )}
      {...props}
    />
  );
}
