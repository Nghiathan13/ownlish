"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import type { CatalogWord } from "@/entities/collection/api/collections";
import { CatalogWordsTable } from "@/features/collections/detail/system/panel/components/CatalogWordsTable";
import { useCatalogTableColumnVisibility } from "@/features/collections/detail/system/panel/hooks/useCatalogTableColumnVisibility";
import {
  getSelectableCatalogDefinitions,
  getSelectedCatalogDefinitions,
} from "@/features/collections/detail/system/panel/lib/catalogSelection";
import { CATALOG_TOGGLEABLE_COLUMNS } from "@/features/collections/detail/system/panel/lib/catalogTableColumns";
import {
  getOxfordPath,
  type OxfordBand,
} from "@/features/collections/oxford/lib/oxfordNavigation";
import { useImportOxfordPart } from "@/features/collections/oxford/model/useImportOxfordPart";
import { useOxfordPartQuery } from "@/features/collections/oxford/model/useOxfordPartQuery";
import { shouldHandleOxfordNavigation } from "@/features/collections/oxford/model/useOxfordNavigation";
import { WordsColumnPicker } from "@/features/collections/detail/shared/components";
import { formatMessage } from "@/shared/i18n/messages";
import { useT } from "@/shared/providers/LocaleProvider";
import { iconTextButtonClassName } from "@/shared/ui/button";

type OxfordGroupWordsPanelProps = {
  band: OxfordBand;
  group: number;
  isAuthenticated: boolean;
  onBack: () => void;
  userId: string | null;
};

const EMPTY_CATALOG_WORDS: CatalogWord[] = [];

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
  const canImport = isAuthenticated;

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
      setResultMessage(null);
      resetImportState();

      try {
        const result = await importPart({
          band,
          catalogDefinitionIds,
          part: group,
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
    }, [
      band,
      group,
      importPart,
      resetImportState,
      t,
    ],
  );
  const selectedCount = selectedDefinitions.length;
  const importLabel = isImporting
    ? t("collections.importing")
    : formatMessage(t("collections.importCount"), { count: selectedCount });

  return (
    <>
      <div className="m-4 flex flex-row items-center justify-between gap-2">
        <div className="flex flex-row items-center gap-2">
          <Link
            className={iconTextButtonClassName(
              "w-fit shrink-0 border border-surface bg-surface shadow-card hover:border-[var(--hover-on-surface)] hover:bg-[var(--hover-on-surface)] dark:border-border dark:hover:border-border dark:hover:bg-surface dark:hover:[box-shadow:inset_0_0_0_9999px_var(--hover-overlay)]",
            )}
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
        </div>
        <WordsColumnPicker
          columnVisibility={columnVisibility}
          columns={CATALOG_TOGGLEABLE_COLUMNS.map((column) => ({
            id: column.id,
            label: t(column.labelKey),
          }))}
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
