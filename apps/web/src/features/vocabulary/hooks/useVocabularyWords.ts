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

type UseVocabularyWordsParams = {
  accessToken: string | null;
  clearSession: () => void;
  isAuthenticated: boolean;
};

export function useVocabularyWords({
  accessToken,
  clearSession,
  isAuthenticated,
}: UseVocabularyWordsParams) {
  const [words, setWords] = useState<VocabWord[]>([]);
  const [totalWords, setTotalWords] = useState(0);
  const [isLoadingWords, setIsLoadingWords] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [deletingWordId, setDeletingWordId] = useState<string | null>(null);
  const [updatingWordId, setUpdatingWordId] = useState<string | null>(null);
  const mutationVersionRef = useRef(0);

  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      return;
    }

    let cancelled = false;
    const requestMutationVersion = mutationVersionRef.current;

    queueMicrotask(() => {
      if (!cancelled) {
        setIsLoadingWords(true);
        setLoadError(null);
      }
    });

    listVocabWords(accessToken)
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
  }, [accessToken, clearSession, isAuthenticated]);

  async function createWord(input: CreateVocabWordInput) {
    if (!accessToken) {
      return;
    }

    try {
      const createdWord = await createVocabWord(accessToken, input);

      mutationVersionRef.current += 1;
      setWords((currentWords) => [createdWord, ...currentWords]);
      setTotalWords((currentTotal) => currentTotal + 1);
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
      setLoadError(null);
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
    createWord,
    deleteWord,
    deletingWordId,
    isLoadingWords,
    loadError,
    totalWords,
    updateWord,
    updatingWordId,
    words,
  };
}
