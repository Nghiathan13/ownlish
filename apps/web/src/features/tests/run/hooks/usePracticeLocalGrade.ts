"use client";

import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { ToeicQuestionGroup } from "@/entities/toeic/api/types";
import {
  applyGradedAnswer,
  applySelectionOnly,
  revertGradedAnswer,
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
      queryClient.setQueryData<{ groups: ToeicQuestionGroup[] }>(queryKey, (current) => {
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
      });
    },
    [answerKeyMap, queryClient, queryKey],
  );

  const gradeGroupLocally = useCallback(
    (
      entries: Array<{ toeicQuestionId: number; selectedKey: OptionKey }>,
    ) => {
      if (!answerKeyMap) {
        return;
      }

      queryClient.setQueryData<{ groups: ToeicQuestionGroup[] }>(queryKey, (current) => {
        if (!current) {
          return current;
        }

        let next = current;

        for (const entry of entries) {
          const answerKey = answerKeyMap.get(entry.toeicQuestionId);
          if (!answerKey) {
            continue;
          }

          next = applyGradedAnswer(
            next,
            entry.toeicQuestionId,
            entry.selectedKey,
            entry.selectedKey === answerKey,
          );
        }

        return next;
      });
    },
    [answerKeyMap, queryClient, queryKey],
  );

  const rollbackGroupGrade = useCallback(
    (
      entries: Array<{ toeicQuestionId: number; selectedKey: OptionKey }>,
    ) => {
      queryClient.setQueryData<{ groups: ToeicQuestionGroup[] }>(queryKey, (current) => {
        if (!current) {
          return current;
        }

        let next = current;

        for (const entry of entries) {
          next = revertGradedAnswer(
            next,
            entry.toeicQuestionId,
            entry.selectedKey,
          );
        }

        return next;
      });
    },
    [queryClient, queryKey],
  );

  return {
    gradeLocally,
    gradeGroupLocally,
    rollbackGroupGrade,
  };
}
