import { Skeleton } from "@/shared/ui/Skeleton";

export function ReviewCollectionToolbarSkeleton() {
  return (
    <div aria-hidden className="mb-4 px-4">
      <Skeleton className="h-10 w-48 max-w-[14rem] rounded-lg" />
    </div>
  );
}
