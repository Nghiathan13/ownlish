"use client";

import { useCallback, useMemo, useState } from "react";
import type { CatalogWord } from "@/entities/collection/api/collections";
import { useCatalogWordsPagination } from "@/features/collections/detail/system/panel/hooks/useCatalogWordsPagination";
import { useCatalogTableColumnVisibility } from "@/features/collections/detail/system/panel/hooks/useCatalogTableColumnVisibility";
import {
  getSelectableCatalogDefinitions,
  getSelectedCatalogDefinitions,
} from "@/features/collections/detail/system/panel/lib/catalogSelection";

const EMPTY_DEFINITION_SELECTION = new Set<string>();

type UseSystemCollectionWordsPanelParams = {
  onImportClick: (
    catalogDefinitionIds: string[] | undefined,
    targetCollectionId: string,
  ) => Promise<void>;
  words: CatalogWord[];
};

export function useSystemCollectionWordsPanel({
  onImportClick,
  words,
}: UseSystemCollectionWordsPanelParams) {
  const [search, setSearch] = useState("");
  const { columnVisibility, toggleColumn } = useCatalogTableColumnVisibility();
  const {
    canGoNext,
    canGoPrevious,
    debouncedSearch,
    nextPage,
    offset,
    pageSize,
    paginatedWords,
    previousPage,
    setPageSize,
    totalWords,
  } = useCatalogWordsPagination(words, search);
  const selectionScope = `${debouncedSearch}:${offset}:${pageSize}`;
  const [selectionByScope, setSelectionByScope] = useState<{
    scope: string;
    ids: Set<string>;
  }>(() => ({
    scope: selectionScope,
    ids: new Set(),
  }));
  const selectedDefinitionIds =
    selectionByScope.scope === selectionScope
      ? selectionByScope.ids
      : EMPTY_DEFINITION_SELECTION;
  const hasSearch = Boolean(debouncedSearch.trim());

  const updateSelection = useCallback(
    (updater: (currentIds: Set<string>) => Set<string>) => {
      setSelectionByScope((current) => {
        const currentIds =
          current.scope === selectionScope
            ? current.ids
            : EMPTY_DEFINITION_SELECTION;

        return {
          scope: selectionScope,
          ids: updater(currentIds),
        };
      });
    },
    [selectionScope],
  );

  const selectableDefinitions = useMemo(
    () => getSelectableCatalogDefinitions(paginatedWords),
    [paginatedWords],
  );
  const selectedDefinitions = useMemo(
    () =>
      getSelectedCatalogDefinitions(paginatedWords, selectedDefinitionIds),
    [paginatedWords, selectedDefinitionIds],
  );
  const allDefinitionsSelected =
    selectableDefinitions.length > 0 &&
    selectableDefinitions.every((item) =>
      selectedDefinitionIds.has(item.definition.id),
    );
  const someDefinitionsSelected = selectableDefinitions.some((item) =>
    selectedDefinitionIds.has(item.definition.id),
  );

  const toggleDefinition = useCallback(
    (definitionId: string) => {
      updateSelection((currentIds) => {
        const nextIds = new Set(currentIds);

        if (nextIds.has(definitionId)) {
          nextIds.delete(definitionId);
        } else {
          nextIds.add(definitionId);
        }

        return nextIds;
      });
    },
    [updateSelection],
  );

  const toggleAllDefinitions = useCallback(() => {
    updateSelection((currentIds) => {
      const allIds = selectableDefinitions.map((item) => item.definition.id);
      const allSelected =
        allIds.length > 0 && allIds.every((id) => currentIds.has(id));

      if (allSelected) {
        return new Set();
      }

      return new Set(allIds);
    });
  }, [selectableDefinitions, updateSelection]);

  const handleImportAllClick = useCallback(
    async (targetCollectionId: string) => {
      try {
        await onImportClick(undefined, targetCollectionId);
        updateSelection(() => new Set());
      } catch {
        // Parent renders the import error message.
      }
    },
    [onImportClick, updateSelection],
  );

  const handleImportSelectedClick = useCallback(
    async (targetCollectionId: string) => {
      try {
        await onImportClick(
          selectedDefinitions.map((item) => item.definition.id),
          targetCollectionId,
        );
        updateSelection(() => new Set());
      } catch {
        // Parent renders the import error message.
      }
    },
    [onImportClick, selectedDefinitions, updateSelection],
  );

  return {
    allDefinitionsSelected,
    canGoNext,
    canGoPrevious,
    columnVisibility,
    debouncedSearch,
    handleImportAllClick,
    handleImportSelectedClick,
    hasSearch,
    nextPage,
    offset,
    pageSize,
    paginatedWords,
    previousPage,
    search,
    selectedDefinitionIds,
    selectedDefinitions,
    setPageSize,
    setSearch,
    someDefinitionsSelected,
    toggleAllDefinitions,
    toggleColumn,
    toggleDefinition,
    totalWords,
  };
}
