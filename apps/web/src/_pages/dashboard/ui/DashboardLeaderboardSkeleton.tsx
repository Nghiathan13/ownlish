import { Skeleton } from "@/shared/ui/Skeleton";

export function DashboardLeaderboardSkeleton() {
  return (
    <div aria-hidden className="flex flex-col gap-5">
      <div>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="mt-2 h-4 w-72" />
      </div>
      <div className="flex gap-3">
        <Skeleton className="h-9 w-28 rounded-lg" />
        <Skeleton className="h-9 w-28 rounded-lg" />
      </div>
      <div className="min-h-[360px] rounded-2xl border border-border bg-surface-card">
        <div className="border-b border-border px-4 py-3">
          <Skeleton className="h-4 w-full" />
        </div>
        <div className="grid gap-2 p-4">
          {Array.from({ length: 8 }, (_, index) => (
            <Skeleton className="h-12 w-full rounded-md" key={index} />
          ))}
        </div>
      </div>
    </div>
  );
}
