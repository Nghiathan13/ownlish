import { classNames } from "@/shared/lib/classNames";

export const iconTextButtonLayoutClassName =
  "inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border px-4 py-2 text-base font-normal [&_svg]:size-5 disabled:cursor-not-allowed disabled:opacity-50";

export const iconOnlyButtonLayoutClassName =
  "inline-flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-md [&_svg]:size-4 disabled:cursor-not-allowed disabled:text-foreground disabled:opacity-50";

export function iconTextButtonClassName(...extra: (string | false | null | undefined)[]) {
  return classNames(iconTextButtonLayoutClassName, ...extra);
}

export function iconOnlyButtonClassName(...extra: (string | false | null | undefined)[]) {
  return classNames(iconOnlyButtonLayoutClassName, ...extra);
}
