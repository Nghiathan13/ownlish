import { Skeleton } from "@/shared/ui/Skeleton";

function MetricCardSkeleton() {
  return (
    <div className="min-h-32 rounded-2xl bg-surface p-5 shadow-card sm:p-6">
      <Skeleton className="h-3 w-20" />
      <Skeleton className="mt-3 h-10 w-20" />
    </div>
  );
}

export function HomeDashboardSkeleton() {
  return (
    <div aria-hidden className="flex flex-col gap-4 lg:gap-8">
      <div>
        <Skeleton className="h-8 w-36" />
        <div className="@container mt-4 grid grid-cols-2 gap-4 lg:gap-8 @[1248px]:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <MetricCardSkeleton key={index} />
          ))}
        </div>
      </div>
      <div>
        <Skeleton className="h-8 w-20" />
        <div className="@container mt-4 grid grid-cols-2 gap-4 lg:gap-8 @[1248px]:grid-cols-4">
          {Array.from({ length: 2 }, (_, index) => (
            <MetricCardSkeleton key={index} />
          ))}
        </div>
        <div className="mt-4 rounded-2xl bg-surface p-5 shadow-card sm:p-6 lg:mt-8">
          <div className="space-y-5">
            {Array.from({ length: 7 }, (_, index) => (
              <div key={index}>
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-14" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <Skeleton className="mt-2 h-2 w-full rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
