import { useCallback, useEffect, useState } from "react";
import type { VocabPageState } from "@/entities/vocab/lib/vocabCache";
import {
  DEFAULT_VOCABULARY_PAGE_SIZE,
  isVocabularyPageSize,
  type VocabularyPageSize,
} from "@/entities/vocab/lib/vocabPagination";

type UseVocabularyPageStateParams = {
  search: string;
};

export function useVocabularyPageState({
  search,
}: UseVocabularyPageStateParams) {
  const [pageState, setPageState] = useState<VocabPageState>({
    offset: 0,
    pageSize: DEFAULT_VOCABULARY_PAGE_SIZE,
    search,
  });

  useEffect(() => {
    if (pageState.search === search) {
      return;
    }

    queueMicrotask(() => {
      setPageState((currentPageState) =>
        currentPageState.search === search
          ? currentPageState
          : { ...currentPageState, search, offset: 0 },
      );
    });
  }, [pageState.search, search]);

  const nextPage = useCallback(() => {
    setPageState((currentPageState) => ({
      ...currentPageState,
      offset: currentPageState.offset + currentPageState.pageSize,
    }));
  }, []);

  const previousPage = useCallback(() => {
    setPageState((currentPageState) => ({
      ...currentPageState,
      offset: Math.max(0, currentPageState.offset - currentPageState.pageSize),
    }));
  }, []);

  const resetToFirstPage = useCallback(() => {
    setPageState((currentPageState) => ({
      ...currentPageState,
      offset: 0,
    }));
  }, []);

  const moveBackOnePage = useCallback(() => {
    setPageState((currentPageState) => ({
      ...currentPageState,
      offset: Math.max(0, currentPageState.offset - currentPageState.pageSize),
    }));
  }, []);

  const setPageSize = useCallback((pageSize: VocabularyPageSize) => {
    setPageState((currentPageState) => ({
      ...currentPageState,
      pageSize,
      offset: 0,
    }));
  }, []);

  const updatePageSize = useCallback((value: number) => {
    if (!isVocabularyPageSize(value)) {
      return;
    }

    setPageSize(value);
  }, [setPageSize]);

  return {
    moveBackOnePage,
    nextPage,
    pageState,
    previousPage,
    resetToFirstPage,
    setPageSize: updatePageSize,
  };
}
