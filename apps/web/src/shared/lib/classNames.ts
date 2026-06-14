import { twMerge } from "tailwind-merge";

export function classNames(
  ...values: Array<string | false | null | undefined>
) {
  return twMerge(...(values.filter(Boolean) as string[]));
}
