"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useCreateVocabularyWord } from "./useCreateVocabularyWord";
import { useDeleteVocabularyWord } from "./useDeleteVocabularyWord";
import { useUpdateVocabularyWord } from "./useUpdateVocabularyWord";
import { useVocabularyListQuery } from "./useVocabularyListQuery";
import { useVocabularyPageState } from "./useVocabularyPageState";

const VOCABULARY_PAGE_SIZE = 50;

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
  } = useVocabularyPageState({
    pageSize: VOCABULARY_PAGE_SIZE,
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
    pageSize: VOCABULARY_PAGE_SIZE,
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

  const { updateWord, updatingWordId } = useUpdateVocabularyWord({
    accessToken,
    clearSession,
    queryClient,
    queryKey,
    userId,
  });

  const { deleteWord, deletingWordId } = useDeleteVocabularyWord({
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
    deleteWord,
    deletingWordId,
    isInitialLoading,
    isLoadingWords,
    isRefreshing,
    loadError,
    nextPage,
    offset: pageState.offset,
    pageSize: VOCABULARY_PAGE_SIZE,
    previousPage,
    reload,
    totalWords,
    updateWord,
    updatingWordId,
    words,
  };
}
