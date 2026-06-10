"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import {
  createVocabWord,
  deleteVocabWord,
  listVocabWords,
  updateVocabWord,
  type CreateVocabWordInput,
  type UpdateVocabWordInput,
  type VocabWord,
} from "@/entities/vocab/api/vocab";
import { ApiError, isUnauthorizedError } from "@/shared/api/http";

const VOCABULARY_PAGE_SIZE = 50;

type UseVocabularyWordsParams = {
  accessToken: string | null;
  clearSession: () => void;
  isAuthenticated: boolean;
  search: string;
};

export function useVocabularyWords({
  accessToken,
  clearSession,
  isAuthenticated,
  search,
}: UseVocabularyWordsParams) {
  const [offset, setOffset] = useState(0);
  const queryClient = useQueryClient();
  const previousSearchRef = useRef(search);

  // Sync offset synchronously during render when search changes
  let activeOffset = offset;
  if (previousSearchRef.current !== search) {
    previousSearchRef.current = search;
    setOffset(0);
    activeOffset = 0;
  }

  const { data, isLoading: isInitialLoading, isFetching, error: queryError } = useQuery({
    queryKey: ["vocab", { accessToken, search, offset: activeOffset }],
    queryFn: async ({ signal }) => {
      if (!accessToken) throw new Error("No access token");
      try {
        return await listVocabWords(accessToken, {
          limit: VOCABULARY_PAGE_SIZE,
          offset: activeOffset,
          search: search.trim() || undefined,
          signal,
        });
      } catch (error) {
        if (isUnauthorizedError(error)) {
          clearSession();
        }
        throw error;
      }
    },
    enabled: isAuthenticated && Boolean(accessToken),
    placeholderData: keepPreviousData,
  });

  const words = data?.items ?? [];
  const totalWords = data?.meta.total ?? 0;
  const isRefreshing = isFetching && words.length > 0;

  const loadError = queryError
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
      if (offset === 0) {
        queryClient.setQueryData(
          ["vocab", { accessToken, search, offset: 0 }],
          (oldData: any) => {
            if (!oldData) return oldData;
            return {
              ...oldData,
              items: [createdWord, ...oldData.items],
              meta: {
                ...oldData.meta,
                total: oldData.meta.total + 1,
              },
            };
          }
        );
      }
      queryClient.invalidateQueries({ queryKey: ["vocab"] });
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
      const queryKey = ["vocab", { accessToken, search, offset }];
      await queryClient.cancelQueries({ queryKey });
      const previousVocab = queryClient.getQueryData(queryKey);

      queryClient.setQueryData(queryKey, (oldData: any) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          items: oldData.items.map((w: VocabWord) =>
            w.id === wordToUpdate.id ? { ...w, ...input } : w
          ),
        };
      });

      return { previousVocab };
    },
    onError: (error, variables, context) => {
      if (context?.previousVocab) {
        queryClient.setQueryData(
          ["vocab", { accessToken, search, offset }],
          context.previousVocab
        );
      }
      if (isUnauthorizedError(error)) {
        clearSession();
      }
    },
    onSuccess: (updatedWord) => {
      queryClient.setQueryData(
        ["vocab", { accessToken, search, offset }],
        (oldData: any) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            items: oldData.items.map((w: VocabWord) =>
              w.id === updatedWord.id ? updatedWord : w
            ),
          };
        }
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["vocab"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (wordToDelete: VocabWord) => {
      if (!accessToken) throw new Error("No access token");
      return deleteVocabWord(accessToken, wordToDelete.id);
    },
    onMutate: async (wordToDelete) => {
      const queryKey = ["vocab", { accessToken, search, offset }];
      await queryClient.cancelQueries({ queryKey });
      const previousVocab = queryClient.getQueryData(queryKey);

      queryClient.setQueryData(queryKey, (oldData: any) => {
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

      return { previousVocab };
    },
    onError: (error, wordToDelete, context) => {
      if (context?.previousVocab) {
        queryClient.setQueryData(
          ["vocab", { accessToken, search, offset }],
          context.previousVocab
        );
      }
      if (isUnauthorizedError(error)) {
        clearSession();
      }
    },
    onSuccess: (_, wordToDelete) => {
      const currentWordsCount = words.length;
      const isLastItemOnPage = currentWordsCount === 1;
      if (isLastItemOnPage && offset > 0) {
        setOffset((currentOffset) =>
          Math.max(0, currentOffset - VOCABULARY_PAGE_SIZE)
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["vocab"] });
    },
  });

  const nextPage = useCallback(() => {
    setOffset((currentOffset) => currentOffset + VOCABULARY_PAGE_SIZE);
  }, []);

  const previousPage = useCallback(() => {
    setOffset((currentOffset) =>
      Math.max(0, currentOffset - VOCABULARY_PAGE_SIZE)
    );
  }, []);

  return {
    canGoNext: activeOffset + words.length < totalWords,
    canGoPrevious: activeOffset > 0,
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
    offset: activeOffset,
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
