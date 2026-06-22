"use client";

import { useEffect, useMemo, useState } from "react";
import type { CatalogWord } from "@/entities/collection/api/collections";
import {
  DEFAULT_VOCABULARY_PAGE_SIZE,
  isVocabularyPageSize,
  type VocabularyPageSize,
} from "@/entities/vocab/lib/vocabPagination";
import { useDebouncedValue } from "@/shared/hooks/useDebouncedValue";

export function useCatalogWordsPagination(words: CatalogWord[], search: string) {
  const debouncedSearch = useDebouncedValue(search, 300);
  const [offset, setOffset] = useState(0);
  const [pageSize, setPageSize] = useState<VocabularyPageSize>(
    DEFAULT_VOCABULARY_PAGE_SIZE,
  );

  const filteredWords = useMemo(() => {
    const query = debouncedSearch.trim().toLowerCase();

    if (!query) {
      return words;
    }

    return words.filter((word) => word.word.toLowerCase().includes(query));
  }, [debouncedSearch, words]);

  useEffect(() => {
    queueMicrotask(() => {
      setOffset(0);
    });
  }, [debouncedSearch, words, pageSize]);

  const totalWords = filteredWords.length;
  const clampedOffset =
    totalWords === 0
      ? 0
      : Math.min(offset, Math.max(0, totalWords - pageSize));

  const paginatedWords = useMemo(() => {
    return filteredWords.slice(clampedOffset, clampedOffset + pageSize);
  }, [clampedOffset, filteredWords, pageSize]);

  const canGoNext = clampedOffset + pageSize < totalWords;
  const canGoPrevious = clampedOffset > 0;

  function nextPage() {
    setOffset((current) => current + pageSize);
  }

  function previousPage() {
    setOffset((current) => Math.max(0, current - pageSize));
  }

  function updatePageSize(value: number) {
    if (!isVocabularyPageSize(value)) {
      return;
    }

    setPageSize(value);
    setOffset(0);
  }

  return {
    canGoNext,
    canGoPrevious,
    debouncedSearch,
    nextPage,
    offset: clampedOffset,
    pageSize,
    paginatedWords,
    previousPage,
    setPageSize: updatePageSize,
    totalWords,
  };
}
