import { Skeleton } from "@/shared/ui/Skeleton";

function OverviewCardSkeleton() {
  return (
    <div className="rounded-[1.5rem] bg-surface p-5 shadow-card sm:p-6">
      <div className="flex items-center gap-3">
        <Skeleton className="size-11 rounded-xl" />
        <div>
          <Skeleton className="h-3 w-20" />
          <Skeleton className="mt-2 h-6 w-36" />
        </div>
      </div>

      <div className="mt-8 flex items-end justify-between gap-4">
        <div>
          <Skeleton className="h-3 w-24" />
          <Skeleton className="mt-3 h-10 w-20" />
        </div>
        <Skeleton className="h-3 w-28" />
      </div>
      <Skeleton className="mt-4 h-2 w-full rounded-full" />

      <div className="mt-7 grid grid-cols-3 gap-3 border-t border-border pt-5">
        {Array.from({ length: 3 }, (_, index) => (
          <div key={index}>
            <Skeleton className="h-3 w-16" />
            <Skeleton className="mt-2 h-7 w-10" />
          </div>
        ))}
      </div>

      <div className="mt-7 flex gap-3">
        <Skeleton className="h-10 w-40 rounded-lg" />
        <Skeleton className="h-10 w-24 rounded-lg" />
      </div>
    </div>
  );
}

export function HomeDashboardSkeleton() {
  return (
    <div aria-hidden className="flex flex-col gap-5 sm:gap-6">
      <div className="rounded-[1.75rem] bg-muted p-5 sm:p-7 lg:grid lg:grid-cols-[minmax(0,1.35fr)_minmax(16rem,0.65fr)] lg:gap-8">
        <div>
          <Skeleton className="h-4 w-20 bg-foreground/10" />
          <Skeleton className="mt-4 h-8 w-4/5 max-w-md bg-foreground/10" />
          <Skeleton className="mt-3 h-4 w-full max-w-lg bg-foreground/10" />
          <Skeleton className="mt-2 h-4 w-3/4 max-w-sm bg-foreground/10" />
          <Skeleton className="mt-6 h-10 w-36 rounded-lg bg-foreground/10" />
        </div>
        <div className="mt-7 rounded-2xl bg-surface/70 p-4 lg:mt-0">
          <Skeleton className="h-3 w-24" />
          <div className="mt-5 grid grid-cols-2 gap-5">
            {Array.from({ length: 3 }, (_, index) => (
              <div className={index === 2 ? "col-span-2" : undefined} key={index}>
                <Skeleton className="h-3 w-20" />
                <Skeleton className="mt-2 h-7 w-14" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)] lg:gap-6">
        <OverviewCardSkeleton />
        <OverviewCardSkeleton />
      </div>
    </div>
  );
}
