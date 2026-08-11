import { Skeleton } from "@/shared/ui/Skeleton";
import { userCollectionCardGridClassName } from "../../lib/collectionListCard";

const SKELETON_CARD_COUNT = 6;

function CollectionCardSkeleton() {
  return <Skeleton className="min-h-45 w-full rounded-card" />;
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
