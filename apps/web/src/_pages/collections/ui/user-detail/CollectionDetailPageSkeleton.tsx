import { Suspense } from "react";
import { PageShell } from "@/shared/ui/PageShell";
import { CollectionDetailPageSkeletonBody } from "./CollectionDetailPageSkeletonBody";

export function CollectionDetailPageSkeleton() {
  return (
    <PageShell fillViewport>
      <Suspense fallback={null}>
        <CollectionDetailPageSkeletonBody />
      </Suspense>
    </PageShell>
  );
}
