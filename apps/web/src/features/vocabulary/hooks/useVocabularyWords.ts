"use client";

import { useCallback, useEffect, useState } from "react";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  createVocabWord,
  deleteVocabWord,
  listVocabWords,
  updateVocabWord,
  type CreateVocabWordInput,
  type UpdateVocabWordInput,
  type VocabWordListResponse,
  type VocabWord,
} from "@/entities/vocab/api/vocab";
import {
  optimisticallyRemoveFromReviewQueue,
  restoreReviewQueue,
} from "@/entities/vocab/lib/reviewQueueCache";
import { getVocabStatsQueryKey } from "@/entities/vocab/lib/vocabStatsCache";
import { ApiError, isUnauthorizedError } from "@/shared/api/http";

const VOCABULARY_PAGE_SIZE = 50;

type VocabPageState = {
  offset: number;
  search: string;
};

function getVocabQueryKey(userId: string | null, pageState: VocabPageState) {
  return ["vocab", { userId, search: pageState.search, offset: pageState.offset }] as const;
}

function getMutationErrorMessage(error: Error | null) {
  if (!error) {
    return null;
  }

  return error instanceof ApiError ? error.message : "Request failed.";
}

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
  const [pageState, setPageState] = useState<VocabPageState>({
    offset: 0,
    search,
  });
  const queryClient = useQueryClient();

  useEffect(() => {
    if (pageState.search === search) {
      return;
    }

    queueMicrotask(() => {
      setPageState((currentPageState) =>
        currentPageState.search === search
          ? currentPageState
          : { search, offset: 0 },
      );
    });
  }, [pageState.search, search]);

  const queryKey = getVocabQueryKey(userId, pageState);

  const {
    data,
    isLoading: isInitialLoading,
    isFetching,
    error: queryError,
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

  const createMutation = useMutation({
    mutationFn: (input: CreateVocabWordInput) => {
      if (!accessToken) throw new Error("No access token");
      return createVocabWord(accessToken, input);
    },
    onSuccess: (createdWord) => {
      if (pageState.offset !== 0) {
        setPageState((currentPageState) => ({
          ...currentPageState,
          offset: 0,
        }));
      } else {
        queryClient.setQueryData<VocabWordListResponse>(
          queryKey,
          (oldData) => {
            if (!oldData) return oldData;
            return {
              ...oldData,
              items: [createdWord, ...oldData.items],
              meta: {
                ...oldData.meta,
                total: oldData.meta.total + 1,
              },
            };
          },
        );
      }
      queryClient.invalidateQueries({ queryKey: ["vocab"] });
      queryClient.invalidateQueries({ queryKey: ["review-queue"] });
      queryClient.invalidateQueries({ queryKey: getVocabStatsQueryKey(userId) });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        clearSession();
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      wordToUpdate,
      input,
    }: {
      wordToUpdate: VocabWord;
      input: UpdateVocabWordInput;
    }) => {
      if (!accessToken) throw new Error("No access token");
      return updateVocabWord(accessToken, wordToUpdate.id, input);
    },
    onMutate: async ({ wordToUpdate, input }) => {
      await queryClient.cancelQueries({ queryKey });
      const previousVocab =
        queryClient.getQueryData<VocabWordListResponse>(queryKey);

      queryClient.setQueryData<VocabWordListResponse>(queryKey, (oldData) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          items: oldData.items.map((w: VocabWord) =>
            w.id === wordToUpdate.id ? { ...w, ...input } : w
          ),
        };
      });

      return { previousVocab, queryKey };
    },
    onError: (error, variables, context) => {
      if (context?.previousVocab && context.queryKey) {
        queryClient.setQueryData(context.queryKey, context.previousVocab);
      }
      if (isUnauthorizedError(error)) {
        clearSession();
      }
    },
    onSuccess: (updatedWord) => {
      queryClient.setQueryData<VocabWordListResponse>(
        queryKey,
        (oldData) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            items: oldData.items.map((w: VocabWord) =>
              w.id === updatedWord.id ? updatedWord : w
            ),
          };
        },
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["vocab"] });
      queryClient.invalidateQueries({ queryKey: ["review-queue"] });
      queryClient.invalidateQueries({ queryKey: getVocabStatsQueryKey(userId) });
    },
  });

  const deleteMutation = useMutation({
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
        setPageState((currentPageState) => ({
          ...currentPageState,
          offset: Math.max(0, currentPageState.offset - VOCABULARY_PAGE_SIZE),
        })
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["vocab"] });
      queryClient.invalidateQueries({ queryKey: ["review-queue"] });
      queryClient.invalidateQueries({ queryKey: getVocabStatsQueryKey(userId) });
    },
  });

  const mutationError =
    getMutationErrorMessage(deleteMutation.error) ??
    getMutationErrorMessage(updateMutation.error);

  const loadError = queryLoadError ?? mutationError;

  const nextPage = useCallback(() => {
    setPageState((currentPageState) => ({
      ...currentPageState,
      offset: currentPageState.offset + VOCABULARY_PAGE_SIZE,
    }));
  }, []);

  const previousPage = useCallback(() => {
    setPageState((currentPageState) => ({
      ...currentPageState,
      offset: Math.max(0, currentPageState.offset - VOCABULARY_PAGE_SIZE),
    }));
  }, []);

  return {
    canGoNext: pageState.offset + words.length < totalWords,
    canGoPrevious: pageState.offset > 0,
    createWord: async (input: CreateVocabWordInput) => {
      await createMutation.mutateAsync(input);
    },
    deleteWord: async (wordToDelete: VocabWord) => {
      await deleteMutation.mutateAsync(wordToDelete);
    },
    deletingWordId: deleteMutation.isPending ? deleteMutation.variables?.id ?? null : null,
    isInitialLoading,
    isLoadingWords: isFetching,
    isRefreshing,
    loadError,
    nextPage,
    offset: pageState.offset,
    pageSize: VOCABULARY_PAGE_SIZE,
    previousPage,
    totalWords,
    updateWord: async (wordToUpdate: VocabWord, input: UpdateVocabWordInput) => {
      await updateMutation.mutateAsync({ wordToUpdate, input });
    },
    updatingWordId: updateMutation.isPending
      ? updateMutation.variables?.wordToUpdate.id ?? null
      : null,
    words,
  };
}
