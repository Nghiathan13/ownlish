"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import {
  getUserOwnedCollections,
  ImportToolbarButton,
  type CatalogWord,
  useCollectionsListQuery,
} from "@/entities/collection";
import { CATALOG_TOGGLEABLE_COLUMNS } from "../../config/catalog/catalogTableColumns";
import { getSelectableCatalogDefinitions, getSelectedCatalogDefinitions } from "../../lib/catalog/catalogSelection";
import { useCatalogTableColumnVisibility } from "../../model/catalog/useCatalogTableColumnVisibility";
import { CatalogWordsTable } from "../catalog/CatalogWordsTable";
import {
  getOxfordPath,
  type OxfordBand,
} from "@/entities/collection";
import { useImportOxfordPart } from "@/features/collections";
import { useOxfordPartQuery } from "@/features/collections";
import { shouldHandleOxfordNavigation } from "@/features/collections";
import { formatMessage } from "@/shared/i18n";
import { useT } from "@/shared/lib/providers";
import { iconTextButtonClassName } from "@/shared/ui/button";
import { WordsColumnPicker } from "@/shared/ui/WordsTable";

type OxfordGroupWordsPanelProps = {
  band: OxfordBand;
  group: number;
  isAuthenticated: boolean;
  onBack: () => void;
  userId: string | null;
};

const EMPTY_CATALOG_WORDS: CatalogWord[] = [];
const oxfordBackButtonClassName = iconTextButtonClassName(
  "w-fit shrink-0 border border-border bg-surface-card hover:[box-shadow:inset_0_0_0_9999px_var(--hover-overlay)]",
);

export function OxfordGroupWordsPanel({
  band,
  group,
  isAuthenticated,
  onBack,
  userId,
}: OxfordGroupWordsPanelProps) {
  const t = useT();
  const query = useOxfordPartQuery({
    band,
    isAuthenticated,
    part: group,
  });
  const { collections, hasCollectionsList } = useCollectionsListQuery({
    isAuthenticated,
    userId,
  });
  const userOwnedCollections = useMemo(
    () => getUserOwnedCollections(collections),
    [collections],
  );
  const { columnVisibility, toggleColumn } = useCatalogTableColumnVisibility();
  const [selectedDefinitionIds, setSelectedDefinitionIds] = useState<
    ReadonlySet<string>
  >(new Set());
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const { importError, importPart, isImporting, resetImportState } =
    useImportOxfordPart(userId);
  const words = query.part?.items ?? EMPTY_CATALOG_WORDS;
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
  const canImport =
    isAuthenticated &&
    (!hasCollectionsList || userOwnedCollections.length > 0);

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
    async (catalogDefinitionIds: string[], targetCollectionId: string) => {
      setResultMessage(null);
      resetImportState();

      try {
        const result = await importPart({
          band,
          catalogDefinitionIds,
          part: group,
          targetCollectionId,
        });
        setSelectedDefinitionIds(new Set());
        setResultMessage(
          formatMessage(t("collections.importResult"), {
            imported: result.imported,
            updated: result.updated,
            skipped: result.skipped,
          }),
        );
      } catch {
        // The mutation error is rendered below.
      }
    },
    [band, group, importPart, resetImportState, t],
  );
  const selectedCount = selectedDefinitions.length;
  const importLabel = isImporting
    ? t("collections.importing")
    : formatMessage(t("collections.importCount"), { count: selectedCount });

  return (
    <>
      <div className="m-4 flex flex-row items-center justify-start gap-2">
        {canImport && selectedCount > 0 ? (
          <ImportToolbarButton
            collections={userOwnedCollections}
            disabled={
              isImporting ||
              query.isLoading ||
              words.length === 0 ||
              userOwnedCollections.length === 0
            }
            label={importLabel}
            onImport={(targetCollectionId) => {
              void handleImport(
                selectedDefinitions.map((item) => item.definition.id),
                targetCollectionId,
              );
            }}
          />
        ) : (
          <>
            <Link
              className={oxfordBackButtonClassName}
              href={getOxfordPath(band)}
              onClick={(event) => {
                if (!shouldHandleOxfordNavigation(event)) {
                  return;
                }

                event.preventDefault();
                onBack();
              }}
              prefetch={false}
            >
              {t("collections.back")}
            </Link>
            <div className="ml-auto">
              <WordsColumnPicker
                columnVisibility={columnVisibility}
                columns={CATALOG_TOGGLEABLE_COLUMNS.map((column) => ({
                  id: column.id,
                  label: t(column.labelKey),
                }))}
                onToggleColumn={toggleColumn}
              />
            </div>
          </>
        )}
      </div>

      {resultMessage ? (
        <p className="mx-4 mb-4 rounded-lg bg-muted-background p-3 text-sm sm:mx-16">
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
