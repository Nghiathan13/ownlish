import { Skeleton } from "@/shared/ui/Skeleton";

export function ReviewCardSkeleton() {
  return (
    <div
      aria-hidden
      className="grid gap-5 rounded-xl border border-border p-4 sm:gap-6 sm:p-6"
    >
      <div>
        <Skeleton className="mb-2 h-3 w-32" />
        <Skeleton className="h-10 w-3/4 max-w-md sm:h-12" />
        <Skeleton className="mt-2 h-4 w-24" />
      </div>

      <Skeleton className="min-h-20 w-full rounded-lg" />

      <div className="grid gap-2 sm:grid-cols-3 sm:gap-3">
        <Skeleton className="h-10 w-full rounded-lg" />
        <Skeleton className="h-10 w-full rounded-lg" />
        <Skeleton className="h-10 w-full rounded-lg" />
      </div>
    </div>
  );
}
