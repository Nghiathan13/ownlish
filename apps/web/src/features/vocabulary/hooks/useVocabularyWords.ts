"use client";

import { useEffect, useRef, useState } from "react";
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
  const [words, setWords] = useState<VocabWord[]>([]);
  const [totalWords, setTotalWords] = useState(0);
  const [isLoadingWords, setIsLoadingWords] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [deletingWordId, setDeletingWordId] = useState<string | null>(null);
  const [updatingWordId, setUpdatingWordId] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const mutationVersionRef = useRef(0);
  const previousSearchRef = useRef(search);

  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
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
    const requestMutationVersion = mutationVersionRef.current;

    queueMicrotask(() => {
      if (!cancelled) {
        setIsLoadingWords(true);
        setLoadError(null);
      }
    });

    listVocabWords(accessToken, {
      limit: VOCABULARY_PAGE_SIZE,
      offset,
      search: search.trim() || undefined,
    })
      .then((response) => {
        if (
          cancelled ||
          requestMutationVersion !== mutationVersionRef.current
        ) {
          return;
        }

        setWords(response.items);
        setTotalWords(response.meta.total);
      })
      .catch((error) => {
        if (cancelled) {
          return;
        }

        if (isUnauthorizedError(error)) {
          clearSession();
          return;
        }

        setWords([]);
        setTotalWords(0);
        setLoadError(
          error instanceof ApiError
            ? error.message
            : "Cannot load vocabulary.",
        );
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoadingWords(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [accessToken, clearSession, isAuthenticated, offset, search]);

  async function createWord(input: CreateVocabWordInput) {
    if (!accessToken) {
      return;
    }

    try {
      const createdWord = await createVocabWord(accessToken, input);

      mutationVersionRef.current += 1;
      setWords((currentWords) => [createdWord, ...currentWords]);
      setTotalWords((currentTotal) => currentTotal + 1);
      setOffset(0);
      setLoadError(null);
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

    const confirmed = window.confirm(`Delete "${wordToDelete.word}"?`);

    if (!confirmed) {
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
