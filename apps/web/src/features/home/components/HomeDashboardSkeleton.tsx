import { Skeleton } from "@/shared/ui/Skeleton";

function ProgressSectionSkeleton() {
  return (
    <div className="p-5 sm:p-7">
      <Skeleton className="h-3 w-20" />
      <Skeleton className="mt-2 h-6 w-36" />

      <div className="mt-8 grid grid-cols-2 gap-6">
        {Array.from({ length: 2 }, (_, index) => (
          <div key={index}>
            <Skeleton className="h-3 w-20" />
            <Skeleton className="mt-3 h-10 w-20" />
            <Skeleton className="mt-3 h-3 w-28" />
          </div>
        ))}
      </div>

      <Skeleton className="mt-8 h-10 w-40 rounded-lg" />
    </div>
  );
}

export function HomeDashboardSkeleton() {
  return (
    <div aria-hidden className="flex flex-col gap-9 sm:gap-11">
      <div className="overflow-hidden rounded-2xl border border-border bg-surface">
        <div className="grid lg:grid-cols-[minmax(0,1.35fr)_minmax(19rem,0.65fr)]">
          <div className="bg-muted p-5 sm:p-7 lg:p-8">
            <Skeleton className="h-3 w-16 bg-foreground/10" />
            <Skeleton className="mt-4 h-8 w-4/5 max-w-md bg-foreground/10" />
            <Skeleton className="mt-4 h-4 w-full max-w-lg bg-foreground/10" />
            <Skeleton className="mt-2 h-4 w-2/3 max-w-sm bg-foreground/10" />
            <Skeleton className="mt-6 h-10 w-36 rounded-lg bg-foreground/10" />
          </div>

          <div className="border-t border-border p-5 sm:p-7 lg:border-l lg:border-t-0 lg:p-8">
            <Skeleton className="h-4 w-28" />
            <div className="mt-5 divide-y divide-border">
              {Array.from({ length: 2 }, (_, index) => (
                <div className={index === 0 ? "pb-4" : "pt-4"} key={index}>
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="mt-3 h-6 w-32" />
                  <Skeleton className="mt-2 h-3 w-28" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div>
        <Skeleton className="h-6 w-40" />
        <Skeleton className="mt-3 h-3 w-72 max-w-full" />
        <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-surface divide-y divide-border lg:grid lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:divide-x lg:divide-y-0">
          <ProgressSectionSkeleton />
          <ProgressSectionSkeleton />
        </div>
      </div>
    </div>
  );
}
