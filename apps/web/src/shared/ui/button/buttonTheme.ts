import { classNames } from "@/shared/lib/classNames";

export const textButtonLayoutClassName =
  "inline-flex shrink-0 items-center justify-center rounded-lg border px-4 py-2 text-base font-normal cursor-pointer disabled:cursor-not-allowed disabled:opacity-50";

export const iconTextButtonLayoutClassName = classNames(
  textButtonLayoutClassName,
  "gap-2 [&_svg]:block [&_svg]:size-5 [&_svg]:shrink-0",
);

export const iconOnlyButtonLayoutClassName =
  "inline-flex size-8 shrink-0 items-center justify-center rounded-md cursor-pointer [&_svg]:block [&_svg]:size-4 [&_svg]:shrink-0 disabled:cursor-not-allowed disabled:text-foreground disabled:opacity-50";

export function textButtonClassName(...extra: (string | false | null | undefined)[]) {
  return classNames(textButtonLayoutClassName, ...extra);
}

export function iconTextButtonClassName(...extra: (string | false | null | undefined)[]) {
  return classNames(iconTextButtonLayoutClassName, ...extra);
}

export function iconOnlyButtonClassName(...extra: (string | false | null | undefined)[]) {
  return classNames(iconOnlyButtonLayoutClassName, ...extra);
}
