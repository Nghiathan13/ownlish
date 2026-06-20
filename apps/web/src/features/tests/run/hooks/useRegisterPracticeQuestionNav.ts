"use client";

import { useEffect } from "react";
import { usePracticeQuestionNav } from "@/features/tests/run/providers/PracticeExitProvider";

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
  const context = usePracticeQuestionNav();
  const registerQuestionNav = context?.registerQuestionNav;

  useEffect(() => {
    if (!registerQuestionNav) {
      return;
    }

    if (!enabled || totalQuestions === 0) {
      return;
    }

    registerQuestionNav({
      currentQuestionNumber,
      totalQuestions,
    });

    return () => {
      registerQuestionNav(null);
    };
  }, [currentQuestionNumber, enabled, registerQuestionNav, totalQuestions]);
}
