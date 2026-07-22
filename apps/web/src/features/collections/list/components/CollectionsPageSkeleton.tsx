import { PageShell } from "@/shared/ui/PageShell";
import { Skeleton } from "@/shared/ui/Skeleton";

const SKELETON_CARD_COUNT = 6;

function CollectionCardSkeleton() {
  return <Skeleton className="min-h-45 w-full rounded-xl" />;
}

export function CollectionsGridSkeleton() {
  return (
    <div className="mb-4 grid gap-4 px-4 lg:px-16 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: SKELETON_CARD_COUNT }, (_, index) => (
        <CollectionCardSkeleton key={index} />
      ))}
    </div>
  );
}

function CollectionCategorySelectSkeleton() {
  return (
    <div className="my-4 px-4 lg:my-8 lg:px-16">
      <Skeleton className="h-10 w-40 rounded-lg" />
    </div>
  );
}

export function CollectionsPageSkeleton() {
  return (
    <PageShell>
      <CollectionCategorySelectSkeleton />
      <CollectionsGridSkeleton />
    </PageShell>
  );
}
