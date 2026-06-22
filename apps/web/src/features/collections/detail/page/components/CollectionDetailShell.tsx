"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";
import { CollectionDetailHeader } from "@/features/collections/detail/page/components/CollectionDetailHeader";
import { PageShell } from "@/shared/ui/PageShell";

const CollectionDetailContent = dynamic(
  () =>
    import("@/features/collections/detail/page/components/CollectionDetailContent").then(
      (module) => module.CollectionDetailContent,
    ),
  { ssr: false },
);

type CollectionDetailShellProps = {
  collectionId: string;
};

export function CollectionDetailShell({
  collectionId,
}: CollectionDetailShellProps) {
  return (
    <PageShell fillViewport>
      <CollectionDetailHeader collectionId={collectionId} />
      <Suspense fallback={null}>
        <CollectionDetailContent collectionId={collectionId} />
      </Suspense>
    </PageShell>
  );
}
