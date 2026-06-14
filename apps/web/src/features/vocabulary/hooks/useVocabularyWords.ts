"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useCreateVocabularyWord } from "./useCreateVocabularyWord";
import { useDeleteVocabularyDefinition } from "./useDeleteVocabularyDefinition";
import { useUpdateVocabularyWord } from "./useUpdateVocabularyWord";
import { useVocabularyListQuery } from "./useVocabularyListQuery";
import { useVocabularyPageState } from "./useVocabularyPageState";

type UseVocabularyWordsParams = {
  accessToken: string | null;
  clearSession: () => void;
  isAuthenticated: boolean;
  search: string;
  userId: string | null;
};

export function useVocabularyWords({
  accessToken,
  clearSession,
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
    accessToken,
    clearSession,
    isAuthenticated,
    pageSize: pageState.pageSize,
    pageState,
    userId,
  });

  const createWord = useCreateVocabularyWord({
    accessToken,
    clearSession,
    pageState,
    queryClient,
    queryKey,
    resetToFirstPage,
    userId,
  });

  const { updateWord, updatingDefinitionId, updatingWordId } =
    useUpdateVocabularyWord({
    accessToken,
    clearSession,
    queryClient,
    queryKey,
    userId,
  });

  const { deleteDefinition, deleteDefinitions, isDeletingDefinitions } =
    useDeleteVocabularyDefinition({
    accessToken,
    clearSession,
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
