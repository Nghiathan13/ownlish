"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { submitToeicAnswer } from "@/features/tests/run/api/submitToeicAnswer";
import type {
  PracticeMode,
  ToeicRunResult,
  SubmitAnswerResult,
  ToeicQuestion,
  ToeicQuestionGroup,
} from "@/features/tests/shared/api/types";
import {
  buildAnswerKeyMap,
  type OptionKey,
} from "@/features/tests/run/lib/answerKeyMap";
import {
  isPracticeAnswerGraded,
} from "@/features/tests/run/lib/practiceAnswers";
import { useAuthSession, isAuthenticatedStatus } from "@/features/auth/hooks/useAuthSession";
import { runAuthenticatedRequest } from "@/entities/session/model/authenticatedRequest";
import { getToeicRun } from "@/features/tests/run/api/getToeicRun";
import { expandToeicRunParts } from "@/features/tests/run/api/expandToeicRunParts";

type UsePracticeSessionParams = {
  sessionId: string;
  selectedParts: number[];
  mode?: PracticeMode;
  enabled: boolean;
};

type SelectAnswerOptions = {
  replace?: boolean;
  deferGrade?: boolean;
  skipLocalGrade?: boolean;
};

type SyncAnswerOptions = {
  replace?: boolean;
};

function normalizePracticeParts(selectedParts: number[]) {
  return [...new Set(selectedParts)].sort((a, b) => a - b);
}

function getPracticePartsKey(parts: number[]) {
  return parts.join(",");
}

export function getPracticeSessionQueryKey(
  sessionId: string,
  partNumberOrParts: number | number[],
  mode: PracticeMode = "practice",
) {
  const parts = Array.isArray(partNumberOrParts)
    ? normalizePracticeParts(partNumberOrParts)
    : [partNumberOrParts];

  return ["practice-session", sessionId, getPracticePartsKey(parts), mode] as const;
}

function toAnswerMap(groups: ToeicQuestionGroup[]) {
  return new Map(
    groups.flatMap((group) =>
      group.questions.map((question) => [question.id, question] as const),
    ),
  );
}

function getNextGroupStatus(
  questions: ToeicQuestion[],
): ToeicQuestionGroup["groupStatus"] {
  if (!questions.every((question) => isPracticeAnswerGraded(question))) {
    return null;
  }

  return questions.some((question) => question.status === "wrong")
    ? "wrong"
    : "right";
}

function updateQuestion(
  current: ToeicRunResult,
  toeicQuestionId: number,
  updater: (question: ToeicQuestion) => ToeicQuestion,
  options?: { updateGroupStatus?: boolean },
): ToeicRunResult {
  return {
    ...current,
    groups: current.groups.map((group) => {
      let changed = false;
      const questions = group.questions.map((question) => {
        if (question.id !== toeicQuestionId) {
          return question;
        }

        changed = true;
        return updater(question);
      });

      if (!changed) {
        return group;
      }

      return {
        ...group,
        groupStatus: options?.updateGroupStatus
          ? getNextGroupStatus(questions)
          : group.groupStatus,
        questions,
      };
    }),
  };
}

function applyGradedAnswer(
  current: ToeicRunResult,
  toeicQuestionId: number,
  selectedKey: OptionKey,
  isCorrect: boolean,
): ToeicRunResult {
  return updateQuestion(
    current,
    toeicQuestionId,
    (question) => ({
      ...question,
      selectedKey,
      status: isCorrect ? "right" : "wrong",
      isCorrect,
    }),
    { updateGroupStatus: true },
  );
}

function applySelectionOnly(
  current: ToeicRunResult,
  toeicQuestionId: number,
  selectedKey: OptionKey,
): ToeicRunResult {
  return updateQuestion(current, toeicQuestionId, (question) => ({
    ...question,
    selectedKey,
    status: "selected",
    isCorrect: null,
  }));
}

function revertGradedAnswer(
  current: ToeicRunResult,
  toeicQuestionId: number,
  selectedKey: OptionKey,
): ToeicRunResult {
  return updateQuestion(
    current,
    toeicQuestionId,
    (question) => ({
      ...question,
      selectedKey,
      status: "selected",
      isCorrect: null,
    }),
    { updateGroupStatus: true },
  );
}

export function usePracticeSession({
  sessionId,
  selectedParts: selectedPartsInput,
  mode = "practice",
  enabled,
}: UsePracticeSessionParams) {
  const { status } = useAuthSession();
  const isAuthenticated = isAuthenticatedStatus(status);
  const queryClient = useQueryClient();
  const selectedParts = useMemo(
    () => normalizePracticeParts(selectedPartsInput),
    [selectedPartsInput],
  );
  const queryKey = getPracticeSessionQueryKey(sessionId, selectedParts, mode);
  const [pendingQuestionIds, setPendingQuestionIds] = useState<Set<number>>(
    () => new Set(),
  );
  const [failedQuestionIds, setFailedQuestionIds] = useState<Set<number>>(
    () => new Set(),
  );
  const syncVersionsRef = useRef(new Map<number, number>());

  const sessionQuery = useQuery({
    queryKey,
    queryFn: () =>
      runAuthenticatedRequest({
        request: async (token) => {
          await expandToeicRunParts(token, sessionId, selectedParts);

          return getToeicRun(token, sessionId, {
            parts: selectedParts,
            mode,
          });
        },
      }),
    enabled: enabled && isAuthenticated && Boolean(sessionId),
    staleTime: Infinity,
    gcTime: mode === "review_wrong" ? 0 : 5 * 60 * 1000,
    refetchOnMount: false,
    retry: false,
  });

  const sessionData = sessionQuery.data;
  const answerKeyMap = useMemo(
    () => buildAnswerKeyMap(sessionData?.groups ?? []),
    [sessionData?.groups],
  );

  const answersByQuestionId = useMemo(
    () => toAnswerMap(sessionData?.groups ?? []),
    [sessionData?.groups],
  );

  const getAnswer = useCallback(
    (toeicQuestionId: number) => answersByQuestionId.get(toeicQuestionId),
    [answersByQuestionId],
  );

  const bumpSyncVersion = useCallback((toeicQuestionId: number) => {
    const nextVersion = (syncVersionsRef.current.get(toeicQuestionId) ?? 0) + 1;
    syncVersionsRef.current.set(toeicQuestionId, nextVersion);
    return nextVersion;
  }, []);

  const syncAnswerToServer = useCallback(
    async (
      toeicQuestionId: number,
      selectedKey: OptionKey,
      options?: SyncAnswerOptions,
    ): Promise<SubmitAnswerResult | null> => {
      if (!isAuthenticated || !sessionId) {
        return null;
      }

      const existingAnswer = answersByQuestionId.get(toeicQuestionId);
      if (
        existingAnswer &&
        isPracticeAnswerGraded(existingAnswer) &&
        !options?.replace
      ) {
        return null;
      }

      const syncVersion = bumpSyncVersion(toeicQuestionId);

      setPendingQuestionIds((current) => new Set(current).add(toeicQuestionId));
      setFailedQuestionIds((current) => {
        const next = new Set(current);
        next.delete(toeicQuestionId);
        return next;
      });

      try {
        const result = await runAuthenticatedRequest({
          request: (token) =>
            submitToeicAnswer(token, sessionId, {
              toeicQuestionId,
              selectedKey,
              mode,
            }),
        });

        if ((syncVersionsRef.current.get(toeicQuestionId) ?? 0) !== syncVersion) {
          return result;
        }

        if (!result.graded) {
          queryClient.setQueryData<ToeicRunResult>(queryKey, (current) => {
            if (!current) {
              return current;
            }

            return applySelectionOnly(current, toeicQuestionId, selectedKey);
          });

          return result;
        }

        if (mode === "review_wrong") {
          await Promise.all([
            queryClient.invalidateQueries({ queryKey: ["tests"] }),
            queryClient.invalidateQueries({
              queryKey: getPracticeSessionQueryKey(
                sessionId,
                selectedParts,
                "practice",
              ),
            }),
          ]);

          return result;
        }

        await Promise.all([
          queryClient.refetchQueries({ queryKey }),
          queryClient.invalidateQueries({
            queryKey: ["tests"],
          }),
        ]);

        return result;
      } catch {
        if ((syncVersionsRef.current.get(toeicQuestionId) ?? 0) === syncVersion) {
          setFailedQuestionIds((current) => new Set(current).add(toeicQuestionId));
        }
        return null;
      } finally {
        setPendingQuestionIds((current) => {
          const next = new Set(current);
          next.delete(toeicQuestionId);
          return next;
        });
      }
    },
    [
      isAuthenticated,
      answersByQuestionId,
      bumpSyncVersion,
      mode,
      selectedParts,
      queryClient,
      queryKey,
      sessionId,
    ],
  );

  const gradeLocally = useCallback(
    (
      toeicQuestionId: number,
      selectedKey: OptionKey,
      options?: { deferGrade?: boolean },
    ) => {
      queryClient.setQueryData<ToeicRunResult>(queryKey, (current) => {
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

      queryClient.setQueryData<ToeicRunResult>(queryKey, (current) => {
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
      queryClient.setQueryData<ToeicRunResult>(queryKey, (current) => {
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

  const selectAnswer = useCallback(
    (
      toeicQuestionId: number,
      selectedKey: OptionKey,
      options?: SelectAnswerOptions,
    ) => {
      const existingAnswer = answersByQuestionId.get(toeicQuestionId);
      if (
        existingAnswer &&
        isPracticeAnswerGraded(existingAnswer) &&
        !options?.replace
      ) {
        return;
      }

      if (existingAnswer?.selectedKey === selectedKey) {
        return;
      }

      if (!options?.skipLocalGrade) {
        gradeLocally(toeicQuestionId, selectedKey, {
          deferGrade: options?.deferGrade,
        });
      }

      void syncAnswerToServer(toeicQuestionId, selectedKey, {
        replace: options?.replace,
      });
    },
    [answersByQuestionId, gradeLocally, syncAnswerToServer],
  );

  const retrySync = useCallback(
    (toeicQuestionId: number) => {
      const answer = answersByQuestionId.get(toeicQuestionId);
      if (!answer?.selectedKey) {
        return;
      }

      void syncAnswerToServer(toeicQuestionId, answer.selectedKey, {
        replace: true,
      });
    },
    [answersByQuestionId, syncAnswerToServer],
  );

  const submitAnswer = useCallback(
    async (
      toeicQuestionId: number,
      selectedKey: OptionKey,
      options?: { replace?: boolean },
    ): Promise<SubmitAnswerResult | null> => {
      selectAnswer(toeicQuestionId, selectedKey, options);
      return null;
    },
    [selectAnswer],
  );

  const isQuestionPending = useCallback(
    (toeicQuestionId: number) => pendingQuestionIds.has(toeicQuestionId),
    [pendingQuestionIds],
  );

  const isQuestionSyncFailed = useCallback(
    (toeicQuestionId: number) => failedQuestionIds.has(toeicQuestionId),
    [failedQuestionIds],
  );

  const hasSyncFailures = failedQuestionIds.size > 0;

  return {
    sessionId,
    testId: sessionData?.testId ?? null,
    year: sessionData?.year ?? null,
    groups: sessionData?.groups ?? [],
    totalQuestions: sessionData?.totalQuestions ?? 0,
    getAnswer,
    isStarting: sessionQuery.isLoading,
    startError: sessionQuery.error
      ? sessionQuery.error instanceof Error
        ? sessionQuery.error.message
        : "Cannot start practice session."
      : null,
    isSubmitting: pendingQuestionIds.size > 0,
    isQuestionPending,
    isQuestionSyncFailed,
    hasSyncFailures,
    failedQuestionIds,
    selectAnswer,
    gradeGroupLocally,
    rollbackGroupGrade,
    syncAnswerToServer,
    retrySync,
    submitAnswer,
  };
}
