import { BackToCollectionsLink } from "@/features/collections/detail/page/components/BackToCollectionsLink";
import { WordsTableSkeleton } from "@/features/collections/detail/shared/components/WordsTableSkeleton";
import { PageShell } from "@/shared/ui/PageShell";
import { Skeleton } from "@/shared/ui/Skeleton";

export function CollectionDetailPageSkeleton() {
  return (
    <PageShell fillViewport>
      <BackToCollectionsLink />

      <div className="mb-4 flex shrink-0 flex-col gap-2 px-4 sm:flex-row sm:items-center">
        <Skeleton className="h-10 w-28 shrink-0" />
        <Skeleton className="h-10 min-w-0 flex-1" />
        <Skeleton className="h-10 w-24 shrink-0" />
      </div>

      <WordsTableSkeleton />
    </PageShell>
  );
}
