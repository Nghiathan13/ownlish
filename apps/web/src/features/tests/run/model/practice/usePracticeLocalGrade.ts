"use client";

import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { ToeicQuestionGroup } from "@/entities/toeic/api/types";
import {
  applyGradedAnswer,
  applySelectionOnly,
} from "@/entities/toeic/lib/runState";
import type { OptionKey } from "@/features/tests/run/lib/answerKeyMap";

type UsePracticeLocalGradeParams = {
  queryKey: readonly unknown[];
  answerKeyMap: Map<number, OptionKey> | null;
};

export function usePracticeLocalGrade({
  queryKey,
  answerKeyMap,
}: UsePracticeLocalGradeParams) {
  const queryClient = useQueryClient();

  const gradeLocally = useCallback(
    (
      toeicQuestionId: number,
      selectedKey: OptionKey,
      options?: { deferGrade?: boolean },
    ) => {
      queryClient.setQueryData<{ groups: ToeicQuestionGroup[] }>(
        queryKey,
        (current) => {
          if (!current) {
            return current;
          }

          if (options?.deferGrade) {
            return applySelectionOnly(current, toeicQuestionId, selectedKey);
          }

          const answerKey = answerKeyMap?.get(toeicQuestionId);
          if (!answerKey) {
            return applySelectionOnly(current, toeicQuestionId, selectedKey);
          }

          return applyGradedAnswer(
            current,
            toeicQuestionId,
            selectedKey,
            selectedKey === answerKey,
          );
        },
      );
    },
    [answerKeyMap, queryClient, queryKey],
  );

  return { gradeLocally };
}
