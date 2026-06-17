"use client";

import { useMemo } from "react";
import type { ToeicQuestionGroup } from "@/features/tests/api/types";
import { buildAnswerKeyMap } from "@/features/tests/lib/answerKeyMap";
import { usePracticeSession } from "@/features/tests/hooks/usePracticeSession";

type UseFullTestPracticeSessionsParams = {
  accessToken: string | null;
  clearSession: () => void;
  testId: number;
  partGroups: Record<number, ToeicQuestionGroup[] | undefined>;
  enabled: boolean;
};

function usePartPracticeSession(
  params: UseFullTestPracticeSessionsParams,
  partNumber: number,
) {
  const groups = params.partGroups[partNumber];
  const answerKeyMap = useMemo(
    () => buildAnswerKeyMap(groups ?? []),
    [groups],
  );

  return usePracticeSession({
    accessToken: params.accessToken,
    clearSession: params.clearSession,
    testId: params.testId,
    partNumber,
    mode: "normal",
    answerKeyMap,
    enabled: params.enabled && Boolean(groups),
  });
}

export function useFullTestPracticeSessions(
  params: UseFullTestPracticeSessionsParams,
) {
  const session1 = usePartPracticeSession(params, 1);
  const session2 = usePartPracticeSession(params, 2);
  const session3 = usePartPracticeSession(params, 3);
  const session4 = usePartPracticeSession(params, 4);
  const session5 = usePartPracticeSession(params, 5);
  const session6 = usePartPracticeSession(params, 6);
  const session7 = usePartPracticeSession(params, 7);

  const sessions = useMemo(
    (): FullTestSessions =>
      ({
        1: session1,
        2: session2,
        3: session3,
        4: session4,
        5: session5,
        6: session6,
        7: session7,
      }),
    [session1, session2, session3, session4, session5, session6, session7],
  );

  const isStarting =
    session1.isStarting ||
    session2.isStarting ||
    session3.isStarting ||
    session4.isStarting ||
    session5.isStarting ||
    session6.isStarting ||
    session7.isStarting;

  const startError =
    session1.startError ??
    session2.startError ??
    session3.startError ??
    session4.startError ??
    session5.startError ??
    session6.startError ??
    session7.startError;

  const allReady = ([1, 2, 3, 4, 5, 6, 7] as const).every(
    (partNumber) => sessions[partNumber].sessionId != null,
  );

  return {
    sessions,
    isStarting,
    startError,
    allReady,
  };
}

export type ToeicPartNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type FullTestPracticeSession = ReturnType<typeof usePracticeSession>;

export type FullTestSessions = Record<ToeicPartNumber, FullTestPracticeSession>;

export function getFullTestSession(
  sessions: FullTestSessions,
  partNumber: number,
): FullTestPracticeSession {
  return sessions[partNumber as ToeicPartNumber];
}
