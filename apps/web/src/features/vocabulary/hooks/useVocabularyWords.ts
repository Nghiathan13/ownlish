"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  createVocabWord,
  deleteVocabWord,
  listVocabWords,
  updateVocabWord,
  type CreateVocabWordInput,
  type UpdateVocabWordInput,
  type VocabWord,
} from "@/entities/vocab/api/vocab";
import { ApiError, isAbortError, isUnauthorizedError } from "@/shared/api/http";

const VOCABULARY_PAGE_SIZE = 50;

type UseVocabularyWordsParams = {
  accessToken: string | null;
  clearSession: () => void;
  isAuthenticated: boolean;
  search: string;
};

type LoadWordsOptions = {
  offset: number;
  preserveCurrentOnError?: boolean;
  search: string;
  signal?: AbortSignal;
};

export function useVocabularyWords({
  accessToken,
  clearSession,
  isAuthenticated,
  search,
}: UseVocabularyWordsParams) {
  const [words, setWords] = useState<VocabWord[]>([]);
  const [totalWords, setTotalWords] = useState(0);
  const [isLoadingWords, setIsLoadingWords] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [deletingWordId, setDeletingWordId] = useState<string | null>(null);
  const [updatingWordId, setUpdatingWordId] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const mutationVersionRef = useRef(0);
  const previousSearchRef = useRef(search);

  const loadWords = useCallback(
    async ({
      offset: nextOffset,
      preserveCurrentOnError = false,
      search: nextSearch,
      signal,
    }: LoadWordsOptions) => {
      if (!accessToken || signal?.aborted) {
        return;
      }

      const requestMutationVersion = mutationVersionRef.current;

      setIsLoadingWords(true);
      setLoadError(null);

      try {
        const response = await listVocabWords(accessToken, {
          limit: VOCABULARY_PAGE_SIZE,
          offset: nextOffset,
          search: nextSearch.trim() || undefined,
          signal,
        });

        if (
          signal?.aborted ||
          requestMutationVersion !== mutationVersionRef.current
        ) {
          return;
        }

        setWords(response.items);
        setTotalWords(response.meta.total);
      } catch (error) {
        if (signal?.aborted || isAbortError(error)) {
          return;
        }

        if (isUnauthorizedError(error)) {
          clearSession();
          return;
        }

        if (!preserveCurrentOnError) {
          setWords([]);
          setTotalWords(0);
        }
        setLoadError(
          error instanceof ApiError
            ? error.message
            : "Cannot load vocabulary.",
        );
      } finally {
        if (!signal?.aborted) {
          setIsLoadingWords(false);
        }
      }
    },
    [accessToken, clearSession],
  );

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    const searchChanged = previousSearchRef.current !== search;

    if (searchChanged && offset !== 0) {
      previousSearchRef.current = search;
      setOffset(0);
      return;
    }

    previousSearchRef.current = search;

    const abortController = new AbortController();

    void loadWords({
      offset,
      search,
      signal: abortController.signal,
    });

    return () => {
      abortController.abort();
    };
  }, [isAuthenticated, loadWords, offset, search]);

  const createWord = useCallback(
    async (input: CreateVocabWordInput) => {
      if (!accessToken) {
        return;
      }

      try {
        const createdWord = await createVocabWord(accessToken, input);

        mutationVersionRef.current += 1;

        if (offset !== 0) {
          setOffset(0);
        } else {
          setWords((currentWords) => [createdWord, ...currentWords]);
          setTotalWords((currentTotal) => currentTotal + 1);
          void loadWords({
            offset: 0,
            preserveCurrentOnError: true,
            search,
          });
        }
      } catch (error) {
        if (isUnauthorizedError(error)) {
          clearSession();
          return;
        }

        throw error;
      }
    },
    [accessToken, offset, search, loadWords, clearSession],
  );

  const deleteWord = useCallback(
    async (wordToDelete: VocabWord) => {
      if (!accessToken) {
        return;
      }

      setDeletingWordId(wordToDelete.id);
      setLoadError(null);

      try {
        await deleteVocabWord(accessToken, wordToDelete.id);

        mutationVersionRef.current += 1;
        setWords((currentWords) =>
          currentWords.filter((word) => word.id !== wordToDelete.id),
        );
        setTotalWords((currentTotal) => Math.max(0, currentTotal - 1));

        const isLastItemOnPage = words.length === 1;
        if (isLastItemOnPage && offset > 0) {
          setOffset((currentOffset) =>
            Math.max(0, currentOffset - VOCABULARY_PAGE_SIZE),
          );
        } else {
          void loadWords({
            offset,
            preserveCurrentOnError: true,
            search,
          });
        }
      } catch (error) {
        if (isUnauthorizedError(error)) {
          clearSession();
          return;
        }

        setLoadError(
          error instanceof ApiError ? error.message : "Cannot delete word.",
        );
      } finally {
        setDeletingWordId(null);
      }
    },
    [accessToken, words.length, offset, search, loadWords, clearSession],
  );

  const updateWord = useCallback(
    async (wordToUpdate: VocabWord, input: UpdateVocabWordInput) => {
      if (!accessToken) {
        return;
      }

      setUpdatingWordId(wordToUpdate.id);
      setLoadError(null);

      try {
        const updatedWord = await updateVocabWord(
          accessToken,
          wordToUpdate.id,
          input,
        );

        mutationVersionRef.current += 1;
        setWords((currentWords) =>
          currentWords.map((word) =>
            word.id === updatedWord.id ? updatedWord : word,
          ),
        );
        void loadWords({
          offset,
          preserveCurrentOnError: true,
          search,
        });
      } catch (error) {
        if (isUnauthorizedError(error)) {
          clearSession();
          return;
        }

        throw error;
      } finally {
        setUpdatingWordId(null);
      }
    },
    [accessToken, offset, search, loadWords, clearSession],
  );

  const isInitialLoading = isLoadingWords && words.length === 0;
  const isRefreshing = isLoadingWords && words.length > 0;

  const nextPage = useCallback(() => {
    setOffset((currentOffset) => currentOffset + VOCABULARY_PAGE_SIZE);
  }, []);

  const previousPage = useCallback(() => {
    setOffset((currentOffset) =>
      Math.max(0, currentOffset - VOCABULARY_PAGE_SIZE),
    );
  }, []);

  return {
    canGoNext: offset + words.length < totalWords,
    canGoPrevious: offset > 0,
    createWord,
    deleteWord,
    deletingWordId,
    isInitialLoading,
    isLoadingWords,
    isRefreshing,
    loadError,
    nextPage,
    offset,
    pageSize: VOCABULARY_PAGE_SIZE,
    previousPage,
    totalWords,
    updateWord,
    updatingWordId,
    words,
  };
}
