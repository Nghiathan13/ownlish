import { PageShell } from "@/shared/ui/PageShell";
import { Skeleton } from "@/shared/ui/Skeleton";
import { userCollectionCardGridClassName } from "@/features/collections/shared/lib/collectionListCard";

const SKELETON_CARD_COUNT = 6;

function CollectionCardSkeleton() {
  return <Skeleton className="min-h-45 w-full rounded-[16px]" />;
}

export function CollectionsGridSkeleton() {
  return (
    <div className={userCollectionCardGridClassName}>
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
