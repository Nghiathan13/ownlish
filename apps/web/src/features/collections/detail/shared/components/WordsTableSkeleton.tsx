import { classNames } from "@/shared/lib/classNames";
import { Skeleton } from "@/shared/ui/Skeleton";

const SKELETON_ROW_COUNT = 4;

type WordsTableSkeletonProps = {
  className?: string;
};

export function WordsTableSkeleton({ className }: WordsTableSkeletonProps) {
  return (
    <div
      className={classNames(
        "mx-4 mb-4 flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border",
        className,
      )}
    >
      <Skeleton className="h-10 shrink-0 rounded-none border-b border-border" />
      <div className="flex flex-1 flex-col">
        {Array.from({ length: SKELETON_ROW_COUNT }, (_, index) => (
          <Skeleton
            className={classNames(
              "h-12 w-full shrink-0 rounded-none",
              index < SKELETON_ROW_COUNT - 1 && "border-b border-border",
            )}
            key={index}
          />
        ))}
      </div>
    </div>
  );
}
