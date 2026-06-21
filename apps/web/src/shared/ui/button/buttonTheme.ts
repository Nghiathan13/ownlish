import { classNames } from "@/shared/lib/classNames";

export const iconTextButtonLayoutClassName =
  "inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border px-4 py-2 text-base font-normal [&_svg]:size-5";

export function iconTextButtonClassName(...extra: (string | false | null | undefined)[]) {
  return classNames(iconTextButtonLayoutClassName, ...extra);
}
