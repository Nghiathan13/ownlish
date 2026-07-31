import type { ElementType, ReactNode } from "react";

type FieldProps = {
  as?: "label" | "div";
  children: ReactNode;
  label: string;
};

export function Field({ as = "label", children, label }: FieldProps) {
  const Root = as as ElementType;

  return (
    <Root className="grid gap-2 text-sm font-semibold text-foreground">
      {as === "label" ? label : <span>{label}</span>}
      {children}
    </Root>
  );
}
