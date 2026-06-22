import { PageShell } from "@/shared/ui/PageShell";
import { Skeleton } from "@/shared/ui/Skeleton";

export function CollectionDetailPageSkeleton() {
  return (
    <PageShell fillViewport>
      <div className="mb-4 shrink-0 px-4">
        <Skeleton className="h-9 w-44" />
      </div>

      <div className="mb-4 flex shrink-0 flex-col gap-2 px-4 sm:flex-row sm:items-center">
        <Skeleton className="h-9 w-28 shrink-0" />
        <Skeleton className="h-9 min-w-0 flex-1" />
        <Skeleton className="h-9 w-24 shrink-0" />
      </div>

      <div className="mx-4 mb-4 flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border">
        <Skeleton className="h-11 shrink-0 rounded-none border-b border-border" />
        <div className="flex flex-1 flex-col gap-3 p-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-5/6" />
        </div>
      </div>
    </PageShell>
  );
}
