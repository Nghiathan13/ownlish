import { PageShell } from "@/shared/ui/PageShell";
import { Skeleton } from "@/shared/ui/Skeleton";
import { WordsTableSkeleton } from "@/features/collections/detail/shared/components/WordsTableSkeleton";

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

      <WordsTableSkeleton />
    </PageShell>
  );
}
