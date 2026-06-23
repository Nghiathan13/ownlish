import { classNames } from "@/shared/lib/classNames";

type TopRightCountBadgeProps = {
  count: number;
};

export function TopRightCountBadge({ count }: TopRightCountBadgeProps) {
  return (
    <span
      aria-hidden
      className={classNames(
        "pointer-events-none absolute -right-1 -top-1",
        "inline-flex min-h-4 min-w-4 items-center justify-center rounded-full px-1 py-px",
        "text-[10px] font-semibold leading-none tabular-nums text-background",
        "bg-red-700 dark:bg-red-400",
      )}
    >
      {count}
    </span>
  );
}
