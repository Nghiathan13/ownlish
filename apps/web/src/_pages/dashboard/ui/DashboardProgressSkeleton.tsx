import { Skeleton } from "@/shared/ui/Skeleton";

export function DashboardProgressSkeleton() {
  return (
    <div aria-hidden className="flex flex-col gap-4">
      <div className="flex gap-3">
        {Array.from({ length: 5 }, (_, index) => (
          <Skeleton className="h-9 w-20 rounded-lg" key={index} />
        ))}
      </div>
      <Skeleton className="h-10 w-40 rounded-lg" />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="min-h-[328px] rounded-2xl border border-border bg-surface-card p-4">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="mx-auto mt-10 size-40 rounded-full" />
        </div>
        <div className="min-h-[328px] rounded-2xl border border-border bg-surface-card p-4">
          <Skeleton className="h-6 w-36" />
          <div className="mt-6 space-y-3">
            {Array.from({ length: 4 }, (_, index) => (
              <Skeleton className="h-8 w-full" key={index} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
