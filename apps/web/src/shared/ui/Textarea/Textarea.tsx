import type { TextareaHTMLAttributes } from "react";
import { classNames } from "@/shared/lib/classNames";

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export function Textarea({ className, ...props }: TextareaProps) {
  return (
    <textarea
      className={classNames(
        "min-h-24 w-full resize-y rounded-lg border border-border bg-transparent px-3 py-2.5 text-foreground outline-none transition placeholder:text-muted-foreground focus:border-foreground",
        className,
      )}
      {...props}
    />
  );
}
