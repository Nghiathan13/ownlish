import { useCallback, useEffect, useState } from "react";
import type { VocabPageState } from "@/entities/vocab/lib/vocabCache";

type UseVocabularyPageStateParams = {
  pageSize: number;
  search: string;
};

export function useVocabularyPageState({
  pageSize,
  search,
}: UseVocabularyPageStateParams) {
  const [pageState, setPageState] = useState<VocabPageState>({
    offset: 0,
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
          : { search, offset: 0 },
      );
    });
  }, [pageState.search, search]);

  const nextPage = useCallback(() => {
    setPageState((currentPageState) => ({
      ...currentPageState,
      offset: currentPageState.offset + pageSize,
    }));
  }, [pageSize]);

  const previousPage = useCallback(() => {
    setPageState((currentPageState) => ({
      ...currentPageState,
      offset: Math.max(0, currentPageState.offset - pageSize),
    }));
  }, [pageSize]);

  const resetToFirstPage = useCallback(() => {
    setPageState((currentPageState) => ({
      ...currentPageState,
      offset: 0,
    }));
  }, []);

  const moveBackOnePage = useCallback(() => {
    setPageState((currentPageState) => ({
      ...currentPageState,
      offset: Math.max(0, currentPageState.offset - pageSize),
    }));
  }, [pageSize]);

  return {
    moveBackOnePage,
    nextPage,
    pageState,
    previousPage,
    resetToFirstPage,
  };
}
