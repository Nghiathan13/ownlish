"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useCreateVocabularyWord } from "./useCreateVocabularyWord";
import { useDeleteVocabularyDefinition } from "./useDeleteVocabularyDefinition";
import { useUpdateVocabularyWord } from "./useUpdateVocabularyWord";
import { useVocabularyListQuery } from "./useVocabularyListQuery";
import { useVocabularyPageState } from "./useVocabularyPageState";

type UseVocabularyWordsParams = {
  isAuthenticated: boolean;
  search: string;
  userId: string | null;
};

export function useVocabularyWords({
  isAuthenticated,
  search,
  userId,
}: UseVocabularyWordsParams) {
  const {
    moveBackOnePage,
    nextPage,
    pageState,
    previousPage,
    resetToFirstPage,
    setPageSize,
  } = useVocabularyPageState({
    search,
  });
  const queryClient = useQueryClient();

  const {
    isInitialLoading,
    isLoadingWords,
    isRefreshing,
    loadError,
    queryKey,
    reload,
    totalWords,
    words,
  } = useVocabularyListQuery({
    isAuthenticated,
    pageSize: pageState.pageSize,
    pageState,
    userId,
  });

  const createWord = useCreateVocabularyWord({
    pageState,
    queryClient,
    queryKey,
    resetToFirstPage,
    userId,
  });

  const { updateWord, updatingDefinitionId, updatingWordId } =
    useUpdateVocabularyWord({
      queryClient,
      queryKey,
      userId,
    });

  const { deleteDefinition, deleteDefinitions, isDeletingDefinitions } =
    useDeleteVocabularyDefinition({
      moveBackOnePage,
      pageState,
      queryClient,
      queryKey,
      userId,
      words,
    });

  return {
    canGoNext: pageState.offset + words.length < totalWords,
    canGoPrevious: pageState.offset > 0,
    createWord,
    deleteDefinition,
    deleteDefinitions,
    isDeletingDefinitions,
    isInitialLoading,
    isLoadingWords,
    isRefreshing,
    loadError,
    nextPage,
    offset: pageState.offset,
    pageSize: pageState.pageSize,
    previousPage,
    reload,
    setPageSize,
    totalWords,
    updateWord,
    updatingDefinitionId,
    updatingWordId,
    words,
  };
}
