"use client";

import { useEffect } from "react";
import { useImmersiveQuestionNav } from "@/features/shell/providers/ImmersiveToolbarProvider";

type UseRegisterImmersiveQuestionNavParams = {
  enabled: boolean;
  currentQuestionNumber: number;
  totalQuestions: number;
};

export function useRegisterImmersiveQuestionNav({
  enabled,
  currentQuestionNumber,
  totalQuestions,
}: UseRegisterImmersiveQuestionNavParams) {
  const context = useImmersiveQuestionNav();
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
