import { useCallback } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { listVocabWords } from "@/entities/vocab/api/vocab";
import type { VocabPageState } from "@/entities/vocab/lib/vocabCache";
import { getVocabQueryKey } from "@/entities/vocab/lib/vocabCache";
import { runAuthenticatedRequest } from "@/entities/session/model/authenticatedRequest";
import { ApiError } from "@/shared/api/http";

type UseVocabularyListQueryParams = {
  isAuthenticated: boolean;
  pageSize: number;
  pageState: VocabPageState;
  userId: string | null;
};

export function useVocabularyListQuery({
  isAuthenticated,
  pageSize,
  pageState,
  userId,
}: UseVocabularyListQueryParams) {
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
        request: (token) =>
          listVocabWords(token, {
            limit: pageSize,
            offset: pageState.offset,
            search: pageState.search.trim() || undefined,
            signal,
          }),
      });
    },
    enabled: isAuthenticated && Boolean(userId),
    placeholderData: keepPreviousData,
  });

  const words = data?.items ?? [];
  const totalWords = data?.meta.total ?? 0;

  const reload = useCallback(() => {
    void refetch();
  }, [refetch]);

  return {
    isInitialLoading,
    isLoadingWords: isFetching,
    isRefreshing: isFetching && words.length > 0,
    loadError: queryError
      ? queryError instanceof ApiError
        ? queryError.message
        : "Cannot load vocabulary."
      : null,
    queryKey,
    reload,
    totalWords,
    words,
  };
}
