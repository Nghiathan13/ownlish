"use client";

import { useCallback, useMemo, useState } from "react";
import type { VocabWord, VocabWordDefinition } from "@/entities/vocab/api/vocab";
import { useAuthSession, isAuthenticatedStatus } from "@/features/auth/hooks/useAuthSession";
import { useVocabularyTableColumnVisibility } from "@/features/collections/detail/user/panel/hooks/useVocabularyTableColumnVisibility";
import { useVocabularyWords } from "@/features/collections/detail/user/data/hooks/useVocabularyWords";
import {
  getSelectableDefinitions,
  getSelectedDefinitions,
} from "@/features/collections/detail/user/panel/lib/vocabularySelection";
import { useDebouncedValue } from "@/shared/hooks/useDebouncedValue";

const EMPTY_DEFINITION_SELECTION = new Set<string>();

type EditingTarget = {
  word: VocabWord;
  definitionId: string;
};

type UseCollectionWordsPanelParams = {
  collectionId: string;
};

export function useCollectionWordsPanel({
  collectionId,
}: UseCollectionWordsPanelParams) {
  const { status, user } = useAuthSession();
  const isAuthenticated = isAuthenticatedStatus(status);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);
  const {
    canGoNext,
    canGoPrevious,
    createWord,
    deleteDefinitions,
    isDeletingDefinitions,
    isInitialLoading,
    isRefreshing,
    loadError,
    nextPage,
    offset,
    pageSize,
    previousPage,
    reload,
    setPageSize,
    totalWords,
    updateWord,
    updatingDefinitionId,
    words,
  } = useVocabularyWords({
    collectionId,
    isAuthenticated,
    search: debouncedSearch,
    userId: user?.id ?? null,
  });
  const [isAddWordOpen, setIsAddWordOpen] = useState(false);
  const [editingTarget, setEditingTarget] = useState<EditingTarget | null>(null);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
  const { columnVisibility, toggleColumn } =
    useVocabularyTableColumnVisibility();
  const selectionScope = `${collectionId}:${debouncedSearch}:${offset}:${pageSize}`;
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
    () => getSelectableDefinitions(words),
    [words],
  );
  const selectedDefinitions = useMemo(
    () => getSelectedDefinitions(words, selectedDefinitionIds),
    [selectedDefinitionIds, words],
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

  const handleBulkDelete = useCallback(async () => {
    await deleteDefinitions(selectedDefinitions);
    updateSelection(() => new Set());
    setIsBulkDeleteOpen(false);
  }, [deleteDefinitions, selectedDefinitions, updateSelection]);

  const handleEditWord = useCallback(
    (word: VocabWord, definition: VocabWordDefinition | null) => {
      if (definition) {
        setEditingTarget({
          word,
          definitionId: definition.id,
        });
      }
    },
    [],
  );

  return {
    allDefinitionsSelected,
    canGoNext,
    canGoPrevious,
    columnVisibility,
    createWord,
    debouncedSearch,
    editingTarget,
    handleBulkDelete,
    handleEditWord,
    isAddWordOpen,
    isBulkDeleteOpen,
    isDeletingDefinitions,
    isInitialLoading,
    isRefreshing,
    loadError,
    nextPage,
    offset,
    onReload: reload,
    pageSize,
    previousPage,
    search,
    selectedDefinitionIds,
    selectedDefinitions,
    setIsAddWordOpen,
    setIsBulkDeleteOpen,
    setEditingTarget,
    setPageSize,
    setSearch,
    someDefinitionsSelected,
    toggleAllDefinitions,
    toggleColumn,
    toggleDefinition,
    totalWords,
    updateWord,
    updatingDefinitionId,
    words,
  };
}
