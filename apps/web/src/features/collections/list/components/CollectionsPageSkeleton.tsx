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
    <div className="my-3 px-4 lg:my-6 lg:px-16">
      <div className="relative flex items-end gap-9 pl-3 pb-3">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-5 w-16" />
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-0 -left-4 -right-4 h-[0.6px] bg-border lg:-left-16 lg:-right-16"
        />
      </div>
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
