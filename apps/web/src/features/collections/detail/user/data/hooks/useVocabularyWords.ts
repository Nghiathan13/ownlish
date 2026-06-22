"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useCreateVocabularyWord } from "@/features/collections/detail/user/forms/hooks/useCreateVocabularyWord";
import { useDeleteVocabularyDefinition } from "@/features/collections/detail/user/forms/hooks/useDeleteVocabularyDefinition";
import { useUpdateVocabularyWord } from "@/features/collections/detail/user/forms/hooks/useUpdateVocabularyWord";
import { useVocabularyListQuery } from "./useVocabularyListQuery";
import { useVocabularyPageState } from "./useVocabularyPageState";

type UseVocabularyWordsParams = {
  collectionId: string;
  isAuthenticated: boolean;
  search: string;
  userId: string | null;
};

export function useVocabularyWords({
  collectionId,
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
    collectionId,
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
    collectionId,
    isAuthenticated,
    pageSize: pageState.pageSize,
    pageState,
    userId,
  });

  const createWord = useCreateVocabularyWord({
    collectionId,
    pageState,
    queryClient,
    queryKey,
    resetToFirstPage,
    userId,
  });

  const { updateWord, updatingDefinitionId, updatingWordId } =
    useUpdateVocabularyWord({
      collectionId,
      queryClient,
      queryKey,
      userId,
    });

  const { deleteDefinition, deleteDefinitions, isDeletingDefinitions } =
    useDeleteVocabularyDefinition({
      collectionId,
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
