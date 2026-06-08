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
import { ApiError, isUnauthorizedError } from "@/shared/api/http";

const VOCABULARY_PAGE_SIZE = 50;

type UseVocabularyWordsParams = {
  accessToken: string | null;
  clearSession: () => void;
  isAuthenticated: boolean;
  search: string;
};

type LoadWordsOptions = {
  isCancelled?: () => boolean;
  offset: number;
  preserveCurrentOnError?: boolean;
  search: string;
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
      isCancelled,
      offset: nextOffset,
      preserveCurrentOnError = false,
      search: nextSearch,
    }: LoadWordsOptions) => {
      if (!accessToken) {
        return;
      }

      const requestMutationVersion = mutationVersionRef.current;

      queueMicrotask(() => {
        if (!isCancelled?.()) {
          setIsLoadingWords(true);
          setLoadError(null);
        }
      });

      try {
        const response = await listVocabWords(accessToken, {
          limit: VOCABULARY_PAGE_SIZE,
          offset: nextOffset,
          search: nextSearch.trim() || undefined,
        });

        if (
          isCancelled?.() ||
          requestMutationVersion !== mutationVersionRef.current
        ) {
          return;
        }

        setWords(response.items);
        setTotalWords(response.meta.total);
      } catch (error) {
        if (isCancelled?.()) {
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
        if (!isCancelled?.()) {
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
      queueMicrotask(() => {
        setOffset(0);
      });
      return;
    }

    previousSearchRef.current = search;

    let cancelled = false;

    void loadWords({
      isCancelled: () => cancelled,
      offset,
      search,
    });

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, loadWords, offset, search]);

  async function createWord(input: CreateVocabWordInput) {
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
  }

  async function deleteWord(wordToDelete: VocabWord) {
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

      setLoadError(
        error instanceof ApiError ? error.message : "Cannot delete word.",
      );
    } finally {
      setDeletingWordId(null);
    }
  }

  async function updateWord(wordToUpdate: VocabWord, input: UpdateVocabWordInput) {
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
  }

  return {
    canGoNext: offset + words.length < totalWords,
    canGoPrevious: offset > 0,
    createWord,
    deleteWord,
    deletingWordId,
    isLoadingWords,
    loadError,
    nextPage: () => {
      setOffset((currentOffset) => currentOffset + VOCABULARY_PAGE_SIZE);
    },
    offset,
    pageSize: VOCABULARY_PAGE_SIZE,
    previousPage: () => {
      setOffset((currentOffset) =>
        Math.max(0, currentOffset - VOCABULARY_PAGE_SIZE),
      );
    },
    totalWords,
    updateWord,
    updatingWordId,
    words,
  };
}
