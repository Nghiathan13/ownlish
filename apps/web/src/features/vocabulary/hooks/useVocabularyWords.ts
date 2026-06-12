"use client";

import { useCallback } from "react";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  deleteVocabWord,
  listVocabWords,
  type VocabWordListResponse,
  type VocabWord,
} from "@/entities/vocab/api/vocab";
import {
  optimisticallyRemoveFromReviewQueue,
  restoreReviewQueue,
} from "@/entities/vocab/lib/reviewQueueCache";
import {
  getVocabQueryKey,
  invalidateVocabMutationQueries,
} from "@/entities/vocab/lib/vocabCache";
import { ApiError, isUnauthorizedError } from "@/shared/api/http";
import { useCreateVocabularyWord } from "./useCreateVocabularyWord";
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
      if (!accessToken) throw new Error("No access token");
      try {
        return await listVocabWords(accessToken, {
          limit: VOCABULARY_PAGE_SIZE,
          offset: pageState.offset,
          search: pageState.search.trim() || undefined,
          signal,
        });
      } catch (error) {
        if (isUnauthorizedError(error)) {
          clearSession();
        }
        throw error;
      }
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

  const {
    mutateAsync: deleteWordMutation,
    isPending: isDeletingWord,
    variables: deleteMutationVariables,
  } = useMutation({
    mutationFn: (wordToDelete: VocabWord) => {
      if (!accessToken) throw new Error("No access token");
      return deleteVocabWord(accessToken, wordToDelete.id);
    },
    onMutate: async (wordToDelete) => {
      const offsetAtStart = pageState.offset;
      const wordCountAtStart = words.length;
      await queryClient.cancelQueries({ queryKey });
      const previousVocab =
        queryClient.getQueryData<VocabWordListResponse>(queryKey);

      queryClient.setQueryData<VocabWordListResponse>(queryKey, (oldData) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          items: oldData.items.filter((w: VocabWord) => w.id !== wordToDelete.id),
          meta: {
            ...oldData.meta,
            total: Math.max(0, oldData.meta.total - 1),
          },
        };
      });

      const previousReviewQueue = await optimisticallyRemoveFromReviewQueue(
        queryClient,
        userId,
        wordToDelete.id,
      );

      return {
        previousVocab,
        queryKey,
        offsetAtStart,
        wordCountAtStart,
        previousReviewQueue,
      };
    },
    onError: (error, wordToDelete, context) => {
      if (context?.previousVocab && context.queryKey) {
        queryClient.setQueryData(context.queryKey, context.previousVocab);
      }
      restoreReviewQueue(queryClient, userId, context?.previousReviewQueue);
      if (isUnauthorizedError(error)) {
        clearSession();
      }
    },
    onSuccess: (_, __, context) => {
      const stillOnSamePage = pageState.offset === context?.offsetAtStart;
      const isLastItemOnPage = context?.wordCountAtStart === 1;

      if (isLastItemOnPage && (context?.offsetAtStart ?? 0) > 0 && stillOnSamePage) {
        moveBackOnePage();
      }
    },
    onSettled: () => {
      invalidateVocabMutationQueries(queryClient, userId);
    },
  });

  const loadError = queryLoadError;

  const reload = useCallback(() => {
    void refetch();
  }, [refetch]);

  const deleteWord = useCallback(
    async (wordToDelete: VocabWord) => {
      await deleteWordMutation(wordToDelete);
    },
    [deleteWordMutation],
  );

  return {
    canGoNext: pageState.offset + words.length < totalWords,
    canGoPrevious: pageState.offset > 0,
    createWord,
    deleteWord,
    deletingWordId: isDeletingWord ? deleteMutationVariables?.id ?? null : null,
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
