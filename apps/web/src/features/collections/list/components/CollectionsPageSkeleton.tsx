import { PageShell } from "@/shared/ui/PageShell";
import { Skeleton } from "@/shared/ui/Skeleton";

const SKELETON_CARD_COUNT = 6;
const SKELETON_TAB_COUNT = 4;

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

function CollectionCategoryTabsSkeleton() {
  return (
    <div className="mt-8 mb-4 overflow-x-auto px-4 lg:mt-16 lg:px-16">
      <div className="flex min-w-max items-center gap-2">
        <Skeleton className="h-10 w-40 rounded-lg" />
        <div className="flex gap-2 rounded-[16px] p-2">
          {Array.from({ length: SKELETON_TAB_COUNT }, (_, index) => (
            <Skeleton className="h-9 w-28" key={index} />
          ))}
        </div>
      </div>
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
