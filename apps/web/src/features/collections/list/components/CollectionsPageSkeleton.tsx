import { PageShell } from "@/shared/ui/PageShell";
import { Skeleton } from "@/shared/ui/Skeleton";

const SKELETON_CARD_COUNT = 6;
const SKELETON_TAB_COUNT = 4;

function CollectionCardSkeleton() {
  return <Skeleton className="min-h-[220px] w-full rounded-xl" />;
}

export function CollectionsGridSkeleton() {
  return (
    <div className="mb-4 grid gap-4 px-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: SKELETON_CARD_COUNT }, (_, index) => (
        <CollectionCardSkeleton key={index} />
      ))}
    </div>
  );
}

function CollectionCategoryTabsSkeleton() {
  return (
    <div className="mb-4 flex flex-wrap gap-2 px-4">
      {Array.from({ length: SKELETON_TAB_COUNT }, (_, index) => (
        <Skeleton className="h-9 w-28" key={index} />
      ))}
    </div>
  );
}

export function CollectionsPageSkeleton() {
  return (
    <PageShell>
      <CollectionCategoryTabsSkeleton />
      <CollectionsGridSkeleton />
    </PageShell>
  );
}
