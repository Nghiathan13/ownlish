"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthSession, isAuthenticatedStatus } from "@/features/auth/hooks/useAuthSession";
import type { PracticeMode } from "@/entities/toeic/api/types";
import { ALL_TOEIC_PART_NUMBERS } from "@/features/tests/shared/lib/toeicParts";
import {
  getTestsOverviewPath,
  parsePracticeOverviewPartParam,
} from "@/features/tests/shared/lib/partPracticePaths";
import { usePartPracticeOverviewList } from "@/features/tests/overview/hooks/usePartPracticeOverviewList";
import { useClearPartPracticeHistory } from "@/features/tests/overview/mutations/hooks/useClearPartPracticeHistory";
import { useStartPartPracticeRun } from "@/features/tests/overview/mutations/hooks/useStartPartPracticeRun";

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export function usePartPracticeOverview() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status, user } = useAuthSession();
  const isAuthenticated = isAuthenticatedStatus(status);
  const partFromUrl =
    parsePracticeOverviewPartParam(searchParams.get("part")) ?? 1;
  const [selectedPartNumber, setSelectedPartNumberState] =
    useState(partFromUrl);

  // Sync selected part when URL changes via back/forward or deep link.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- external URL is source of truth for navigation history
    setSelectedPartNumberState((current) =>
      current === partFromUrl ? current : partFromUrl,
    );
  }, [partFromUrl]);

  const { summaries, isLoading, error, reload } = usePartPracticeOverviewList({
    isAuthenticated,
    userId: user?.id ?? null,
  });

  const { startRun, isStarting, startingPartNumber } = useStartPartPracticeRun();
  const {
    clearHistory: clearHistoryMutation,
    isClearing,
    clearingPartNumber,
  } = useClearPartPracticeHistory({
    userId: user?.id ?? null,
  });

  const selectedSummary =
    summaries.find((summary) => summary.partNumber === selectedPartNumber) ??
    summaries.find((summary) => summary.partNumber === 1) ??
    null;

  const setSelectedPartNumber = (partNumber: number) => {
    setSelectedPartNumberState(partNumber);
    router.replace(getTestsOverviewPath({ tab: "part_practice", part: partNumber }), {
      scroll: false,
    });
  };

  const startPartPractice = async (partNumber: number, mode: PracticeMode) => {
    if (!isAuthenticated) {
      return;
    }

    try {
      await startRun({ partNumber, mode });
    } catch (error) {
      window.alert(getErrorMessage(error, "Cannot start part practice."));
    }
  };

  const clearHistory = async (partNumber: number) => {
    if (
      !isAuthenticated ||
      !window.confirm(
        `Clear all aggregate practice answers for Part ${partNumber}? This cannot be undone.`,
      )
    ) {
      return;
    }

    try {
      await clearHistoryMutation(partNumber);
    } catch (error) {
      window.alert(getErrorMessage(error, "Cannot clear part practice history."));
    }
  };

  return {
    allPartNumbers: [...ALL_TOEIC_PART_NUMBERS],
    selectedPartNumber,
    setSelectedPartNumber,
    selectedSummary,
    summaries,
    isLoading,
    error,
    reload,
    startPartPractice,
    clearHistory,
    isStarting,
    startingPartNumber,
    isClearing,
    clearingPartNumber,
  };
}
