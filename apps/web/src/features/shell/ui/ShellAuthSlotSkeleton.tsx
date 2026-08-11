import { classNames } from "@/shared/lib/classNames";
import { Skeleton } from "@/shared/ui/Skeleton";

type ShellAuthSlotSkeletonProps = {
  collapsed?: boolean;
  variant?: "sidebar" | "mobile";
};

export function ShellAuthSlotSkeleton({
  collapsed = false,
  variant = "sidebar",
}: ShellAuthSlotSkeletonProps) {
  if (variant === "mobile") {
    return (
      <div
        aria-hidden
        className="order-2 flex shrink-0 items-center gap-3 sm:order-none sm:gap-4"
      >
        <Skeleton className="hidden h-4 w-32 sm:block" />
        <Skeleton className="h-9 w-20 rounded-lg" />
      </div>
    );
  }

  return (
    <div
      aria-hidden
      className={classNames(
        "flex w-full items-center rounded-lg px-2 py-2",
        collapsed ? "justify-center" : "gap-2",
      )}
    >
      <Skeleton className="size-6 shrink-0 rounded-full" />
      {!collapsed ? <Skeleton className="h-4 w-28" /> : null}
    </div>
  );
}
