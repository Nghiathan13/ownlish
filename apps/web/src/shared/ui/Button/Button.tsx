import type { ButtonHTMLAttributes } from "react";
import { classNames } from "@/shared/lib/classNames";

type ButtonVariant = "primary" | "secondary";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

const baseClassName =
  "inline-flex cursor-pointer items-center justify-center rounded-lg border px-4 py-4 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-60";

const variantClassNames: Record<ButtonVariant, string> = {
  primary: "border-foreground bg-foreground text-background",
  secondary: "border-border bg-transparent text-foreground hover:bg-muted",
};

export function Button({
  className,
  variant = "primary",
  ...props
}: ButtonProps) {
  return (
    <button
      className={classNames(baseClassName, variantClassNames[variant], className)}
      {...props}
    />
  );
}
