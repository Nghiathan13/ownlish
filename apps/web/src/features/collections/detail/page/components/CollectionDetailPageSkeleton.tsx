import { Suspense } from "react";
import { CollectionDetailPageSkeletonBody } from "@/features/collections/detail/page/components/CollectionDetailPageSkeletonBody";
import { PageShell } from "@/shared/ui/PageShell";

export function CollectionDetailPageSkeleton() {
  return (
    <PageShell fillViewport>
      <Suspense fallback={null}>
        <CollectionDetailPageSkeletonBody />
      </Suspense>
    </PageShell>
  );
}
