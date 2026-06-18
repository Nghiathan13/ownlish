"use client";

import { useEffect } from "react";
import { usePracticeExit } from "@/features/tests/providers/PracticeExitProvider";

type UseRegisterPracticeQuestionNavParams = {
  enabled: boolean;
  currentQuestionNumber: number;
  totalQuestions: number;
};

export function useRegisterPracticeQuestionNav({
  enabled,
  currentQuestionNumber,
  totalQuestions,
}: UseRegisterPracticeQuestionNavParams) {
  const context = usePracticeExit();

  useEffect(() => {
    if (!context) {
      return;
    }

    if (!enabled || totalQuestions === 0) {
      return;
    }

    context.registerQuestionNav({
      currentQuestionNumber,
      totalQuestions,
    });

    return () => {
      context.registerQuestionNav(null);
    };
  }, [context, currentQuestionNumber, enabled, totalQuestions]);
}
