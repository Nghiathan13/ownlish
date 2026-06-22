import { classNames } from "@/shared/lib/classNames";

export const textButtonLayoutClassName =
  "inline-flex shrink-0 items-center justify-center rounded-lg border px-4 py-2 text-base font-normal cursor-pointer disabled:cursor-not-allowed disabled:opacity-50";

export const iconInTextButtonLayoutClassName =
  "gap-2 [&_svg]:block [&_svg]:size-5 [&_svg]:shrink-0";

export const primaryTextButtonColorsClassName =
  "border-foreground bg-foreground text-background";

export const secondaryTextButtonColorsClassName =
  "border-border bg-transparent text-foreground hover:border-foreground";

export const iconOnlyButtonLayoutClassName =
  "inline-flex size-8 shrink-0 items-center justify-center rounded-md cursor-pointer [&_svg]:block [&_svg]:size-4 [&_svg]:shrink-0 disabled:cursor-not-allowed disabled:text-foreground disabled:opacity-50";

export function textButtonClassName(...extra: (string | false | null | undefined)[]) {
  return classNames(textButtonLayoutClassName, ...extra);
}

export function primaryTextButtonClassName(
  ...extra: (string | false | null | undefined)[]
) {
  return textButtonClassName(primaryTextButtonColorsClassName, ...extra);
}

export function secondaryTextButtonClassName(
  ...extra: (string | false | null | undefined)[]
) {
  return textButtonClassName(secondaryTextButtonColorsClassName, ...extra);
}

export function iconTextButtonClassName(...extra: (string | false | null | undefined)[]) {
  return classNames(textButtonLayoutClassName, iconInTextButtonLayoutClassName, ...extra);
}

export function iconOnlyButtonClassName(...extra: (string | false | null | undefined)[]) {
  return classNames(iconOnlyButtonLayoutClassName, ...extra);
}
