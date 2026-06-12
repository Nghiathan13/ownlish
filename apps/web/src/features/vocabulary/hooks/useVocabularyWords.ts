"use client";

import { useCallback } from "react";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { listVocabWords } from "@/entities/vocab/api/vocab";
import { getVocabQueryKey } from "@/entities/vocab/lib/vocabCache";
import { runAuthenticatedRequest } from "@/features/auth/lib/authRequest";
import { ApiError } from "@/shared/api/http";
import { useCreateVocabularyWord } from "./useCreateVocabularyWord";
import { useDeleteVocabularyWord } from "./useDeleteVocabularyWord";
import { useUpdateVocabularyWord } from "./useUpdateVocabularyWord";
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

  const queryKey = getVocabQueryKey(userId, pageState);

  const {
    data,
    isLoading: isInitialLoading,
    isFetching,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: async ({ signal }) => {
      return runAuthenticatedRequest({
        accessToken,
        clearSession,
        request: (token) =>
          listVocabWords(token, {
          limit: VOCABULARY_PAGE_SIZE,
          offset: pageState.offset,
          search: pageState.search.trim() || undefined,
          signal,
        }),
      });
    },
    enabled: isAuthenticated && Boolean(accessToken) && Boolean(userId),
    placeholderData: keepPreviousData,
  });

  const words = data?.items ?? [];
  const totalWords = data?.meta.total ?? 0;
  const isRefreshing = isFetching && words.length > 0;

  const queryLoadError = queryError
    ? queryError instanceof ApiError
      ? queryError.message
      : "Cannot load vocabulary."
    : null;

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

  const loadError = queryLoadError;

  const reload = useCallback(() => {
    void refetch();
  }, [refetch]);

  return {
    canGoNext: pageState.offset + words.length < totalWords,
    canGoPrevious: pageState.offset > 0,
    createWord,
    deleteWord,
    deletingWordId,
    isInitialLoading,
    isLoadingWords: isFetching,
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
