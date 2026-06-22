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
      <Skeleton className="h-11 shrink-0 rounded-none border-b border-border" />
      <div className="flex flex-1 flex-col gap-3 p-4">
        {Array.from({ length: SKELETON_ROW_COUNT }, (_, index) => (
          <Skeleton
            className={index === SKELETON_ROW_COUNT - 1 ? "h-10 w-5/6" : "h-10 w-full"}
            key={index}
          />
        ))}
      </div>
    </div>
  );
}
