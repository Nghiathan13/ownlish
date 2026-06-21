import { classNames } from "@/shared/lib/classNames";

export const iconTextButtonLayoutClassName =
  "inline-flex cursor-pointer items-center gap-2 border px-4 py-2 text-base font-normal [&_svg]:size-4";

export function iconTextButtonClassName(...extra: (string | false | null | undefined)[]) {
  return classNames(iconTextButtonLayoutClassName, ...extra);
}
