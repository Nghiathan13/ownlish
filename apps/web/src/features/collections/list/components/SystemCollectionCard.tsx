"use client";

import type { CollectionSummary } from "@/entities/collection/api/collections";
import { getCollectionPath } from "@/entities/collection/lib/collectionDisplay";
import { CollectionCard } from "@/features/collections/shared/components/CollectionCard";
import { SystemCollectionImportButton } from "@/features/collections/list/components/SystemCollectionImportButton";
import { formatCreatedLabel } from "@/shared/lib/date";
import { useLocale, useT } from "@/shared/providers/LocaleProvider";

type SystemCollectionCardProps = {
  collection: CollectionSummary;
  canImport: boolean;
  isImporting: boolean;
  onImport: (collectionId: string) => void;
};

export function SystemCollectionCard({
  collection,
  canImport,
  isImporting,
  onImport,
}: SystemCollectionCardProps) {
  const t = useT();
  const { locale } = useLocale();

  return (
    <CollectionCard
      badge={collection.cefrLevel}
      createdLabel={formatCreatedLabel(collection.createdAt, locale)}
      description={
        collection.description?.trim() || t("collections.noDescription")
      }
      footerAction={
        canImport ? (
          <SystemCollectionImportButton
            isImporting={isImporting}
            onImport={() => onImport(collection.id)}
          />
        ) : null
      }
      href={getCollectionPath(collection)}
      title={collection.name}
      wordCountLabel={`${collection.itemCount} ${t("collections.words")}`}
    />
  );
}
