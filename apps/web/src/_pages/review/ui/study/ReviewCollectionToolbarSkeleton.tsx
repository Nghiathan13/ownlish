import { Skeleton } from "@/shared/ui/Skeleton";

export function ReviewCollectionToolbarSkeleton() {
  return (
    <div aria-hidden className="w-full max-w-72">
      <Skeleton className="h-10 w-full rounded-lg" />
    </div>
  );
}
