import { Skeleton } from "@/shared/ui/Skeleton";

function DashboardCardSkeleton() {
  return (
    <div className="min-h-60 rounded-2xl border border-border bg-surface p-6 sm:p-7">
      <Skeleton className="h-3 w-20" />
      <Skeleton className="mt-2 h-6 w-36" />

      <div className="mt-8 grid grid-cols-2 gap-4">
        {Array.from({ length: 2 }, (_, index) => (
          <div key={index}>
            <Skeleton className="h-3 w-20" />
            <Skeleton className="mt-3 h-10 w-20" />
          </div>
        ))}
      </div>

      <Skeleton className="mt-9 h-10 w-40 rounded-lg" />
    </div>
  );
}

export function HomeDashboardSkeleton() {
  return (
    <div aria-hidden className="grid gap-4 lg:grid-cols-12 lg:gap-5">
      <div className="min-h-60 rounded-2xl border border-border bg-muted p-6 sm:p-7 lg:col-span-5">
        <Skeleton className="h-3 w-14 bg-foreground/10" />
        <Skeleton className="mt-4 h-9 w-4/5 bg-foreground/10" />
        <Skeleton className="mt-9 h-10 w-36 rounded-lg bg-foreground/10" />
      </div>
      <div className="lg:col-span-3">
        <DashboardCardSkeleton />
      </div>
      <div className="lg:col-span-4">
        <DashboardCardSkeleton />
      </div>
    </div>
  );
}
