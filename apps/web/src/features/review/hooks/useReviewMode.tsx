"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { ReviewMode } from "@/features/review/components/ReviewModeToggle";

const REVIEW_MODE_STORAGE_KEY = "engvocab.reviewMode";

type ReviewModeContextValue = {
  isTypingMode: boolean;
  mode: ReviewMode;
  setMode: (mode: ReviewMode) => void;
};

const ReviewModeContext = createContext<ReviewModeContextValue | null>(null);

function readStoredReviewMode(): ReviewMode {
  if (typeof window === "undefined") {
    return "flashcard";
  }

  return window.localStorage.getItem(REVIEW_MODE_STORAGE_KEY) === "typing"
    ? "typing"
    : "flashcard";
}

export function ReviewModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ReviewMode>(readStoredReviewMode);

  const setMode = useCallback((nextMode: ReviewMode) => {
    setModeState(nextMode);
    window.localStorage.setItem(REVIEW_MODE_STORAGE_KEY, nextMode);
  }, []);

  const value = useMemo(
    () => ({
      mode,
      setMode,
      isTypingMode: mode === "typing",
    }),
    [mode, setMode],
  );

  return (
    <ReviewModeContext.Provider value={value}>{children}</ReviewModeContext.Provider>
  );
}

export function useReviewMode() {
  const value = useContext(ReviewModeContext);
  if (value == null) {
    throw new Error("useReviewMode must be used within ReviewModeProvider");
  }
  return value;
}
