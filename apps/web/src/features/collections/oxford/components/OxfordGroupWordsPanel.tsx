"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import type {
  CatalogWord,
  CollectionSummary,
} from "@/entities/collection/api/collections";
import { useCollectionCatalogWordsQuery } from "@/features/collections/shared/data/hooks";
import { useImportCollection } from "@/features/collections/shared/mutations/hooks";
import { CatalogWordsTable } from "@/features/collections/detail/system/panel/components/CatalogWordsTable";
import { useCatalogTableColumnVisibility } from "@/features/collections/detail/system/panel/hooks/useCatalogTableColumnVisibility";
import {
  getSelectableCatalogDefinitions,
  getSelectedCatalogDefinitions,
} from "@/features/collections/detail/system/panel/lib/catalogSelection";
import { CATALOG_TOGGLEABLE_COLUMNS } from "@/features/collections/detail/system/panel/lib/catalogTableColumns";
import {
  getOxfordGroupRange,
  getOxfordPath,
  OXFORD_GROUP_SIZE,
  type OxfordBand,
} from "@/features/collections/oxford/lib/oxfordNavigation";
import { WordsColumnPicker } from "@/features/collections/detail/shared/components";
import { iconTextButtonClassName } from "@/shared/ui/button";

type OxfordGroupWordsPanelProps = {
  band: OxfordBand;
  collection: CollectionSummary;
  group: number;
  isAuthenticated: boolean;
  targetCollectionId: string | null;
  userId: string | null;
};

const EMPTY_CATALOG_WORDS: CatalogWord[] = [];

export function OxfordGroupWordsPanel({
  band,
  collection,
  group,
  isAuthenticated,
  targetCollectionId,
  userId,
}: OxfordGroupWordsPanelProps) {
  const range = getOxfordGroupRange(group, collection.itemCount);
  const query = useCollectionCatalogWordsQuery({
    collectionId: collection.id,
    isAuthenticated,
    limit: OXFORD_GROUP_SIZE,
    offset: range.offset,
    userId,
  });
  const { columnVisibility, toggleColumn } = useCatalogTableColumnVisibility();
  const [selectedDefinitionIds, setSelectedDefinitionIds] = useState<
    ReadonlySet<string>
  >(new Set());
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const { importCollection, importError, isImporting, resetImportState } =
    useImportCollection({ userId });
  const words = query.page?.items ?? EMPTY_CATALOG_WORDS;
  const selectableDefinitions = useMemo(
    () => getSelectableCatalogDefinitions(words),
    [words],
  );
  const selectedDefinitions = useMemo(
    () => getSelectedCatalogDefinitions(words, selectedDefinitionIds),
    [words, selectedDefinitionIds],
  );
  const allDefinitionsSelected =
    selectableDefinitions.length > 0 &&
    selectableDefinitions.every((item) =>
      selectedDefinitionIds.has(item.definition.id),
    );
  const someDefinitionsSelected = selectableDefinitions.some((item) =>
    selectedDefinitionIds.has(item.definition.id),
  );
  const canImport = isAuthenticated && Boolean(targetCollectionId);

  const toggleDefinition = useCallback((definitionId: string) => {
    setSelectedDefinitionIds((current) => {
      const next = new Set(current);

      if (next.has(definitionId)) {
        next.delete(definitionId);
      } else {
        next.add(definitionId);
      }

      return next;
    });
  }, []);

  const toggleAllDefinitions = useCallback(() => {
    setSelectedDefinitionIds((current) => {
      const next = new Set(
        selectableDefinitions.map((item) => item.definition.id),
      );

      const allSelected =
        next.size > 0 && [...next].every((definitionId) => current.has(definitionId));

      return allSelected ? new Set() : next;
    });
  }, [selectableDefinitions]);

  const handleImport = useCallback(
    async (catalogDefinitionIds: string[]) => {
      if (!targetCollectionId) {
        return;
      }

      setResultMessage(null);
      resetImportState();

      try {
        const result = await importCollection({
          catalogDefinitionIds,
          limit: OXFORD_GROUP_SIZE,
          offset: range.offset,
          systemCollectionId: collection.id,
          targetCollectionId,
        });
        setSelectedDefinitionIds(new Set());
        setResultMessage(
          `Imported ${result.imported} words. Updated ${result.updated} existing words. Skipped ${result.skipped} words.`,
        );
      } catch {
        // The mutation error is rendered below.
      }
    }, [
      collection.id,
      importCollection,
      range.offset,
      resetImportState,
      targetCollectionId,
    ],
  );
  const selectedCount = selectedDefinitions.length;
  const importLabel = isImporting
    ? "Importing..."
    : `Import (${selectedCount})`;

  return (
    <>
      <div className="m-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <Link
          className={iconTextButtonClassName(
            "w-fit shrink-0",
            "border-0 bg-surface shadow-card hover:[box-shadow:inset_0_0_0_9999px_var(--hover-overlay)] dark:border dark:border-border",
          )}
          href={getOxfordPath(band)}
        >
          Back to {band}
        </Link>
        {canImport && selectedCount > 0 ? (
          <button
            className={iconTextButtonClassName(
              "w-fit shrink-0",
              "border-foreground bg-foreground text-background",
            )}
            disabled={isImporting || query.isLoading || words.length === 0}
            onClick={() => {
              void handleImport(
                selectedDefinitions.map((item) => item.definition.id),
              );
            }}
            type="button"
          >
            {importLabel}
          </button>
        ) : null}
        <WordsColumnPicker
          columnVisibility={columnVisibility}
          columns={CATALOG_TOGGLEABLE_COLUMNS}
          onToggleColumn={toggleColumn}
        />
      </div>

      {resultMessage ? (
        <p className="mx-4 mb-4 rounded-lg bg-muted p-3 text-sm sm:mx-16">
          {resultMessage}
        </p>
      ) : null}
      {importError ? (
        <p className="mx-4 mb-4 rounded-lg border border-border p-3 text-sm text-danger sm:mx-16">
          {importError}
        </p>
      ) : null}

      <CatalogWordsTable
        allDefinitionsSelected={allDefinitionsSelected}
        columnVisibility={columnVisibility}
        error={query.error}
        isLoading={query.isLoading}
        onRetry={() => void query.reload()}
        onToggleAllDefinitions={toggleAllDefinitions}
        onToggleDefinition={toggleDefinition}
        selectedDefinitionIds={selectedDefinitionIds}
        someDefinitionsSelected={someDefinitionsSelected}
        words={words}
      />
    </>
  );
}
