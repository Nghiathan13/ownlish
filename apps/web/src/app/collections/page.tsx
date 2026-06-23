import { Suspense } from "react";
import { CollectionsPage } from "@/features/collections/list/components/CollectionsPage";
import { CollectionsPageSkeleton } from "@/features/collections/list/components/CollectionsPageSkeleton";

export default function CollectionsRoute() {
  return (
    <Suspense fallback={<CollectionsPageSkeleton />}>
      <CollectionsPage />
    </Suspense>
  );
}
