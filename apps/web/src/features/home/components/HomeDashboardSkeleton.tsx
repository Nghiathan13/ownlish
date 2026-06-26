import { Skeleton } from "@/shared/ui/Skeleton";

const LEVEL_SKELETON_COUNT = 4;

function StatCardSkeleton() {
  return (
    <div className="rounded-xl border border-border p-4">
      <Skeleton className="mb-2 h-3 w-24" />
      <Skeleton className="h-9 w-16" />
    </div>
  );
}

export function HomeDashboardSkeleton() {
  return (
    <div aria-hidden className="flex flex-col gap-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <StatCardSkeleton key={index} />
        ))}
      </div>

      <div className="rounded-xl border border-border p-4">
        <Skeleton className="mb-4 h-4 w-36" />
        <div className="grid gap-2 sm:grid-cols-4">
          {Array.from({ length: LEVEL_SKELETON_COUNT }, (_, index) => (
            <div className="rounded-lg border border-border px-3 py-2" key={index}>
              <Skeleton className="mb-2 h-3 w-14" />
              <Skeleton className="h-7 w-8" />
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Skeleton className="h-10 w-40 rounded-lg" />
        <Skeleton className="h-10 w-36 rounded-lg" />
      </div>
    </div>
  );
}
