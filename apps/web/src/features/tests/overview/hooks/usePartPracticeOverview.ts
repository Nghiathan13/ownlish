"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAuthSession, isAuthenticatedStatus } from "@/features/auth/hooks/useAuthSession";
import type { PracticeMode } from "@/entities/toeic-runtime/model/presentation";
import { ALL_TOEIC_PART_NUMBERS } from "@/features/tests/shared/lib/toeicParts";
import { parsePracticeOverviewPartParam } from "@/features/tests/shared/lib/partPracticePaths";
import { usePartPracticeOverviewList } from "@/features/tests/overview/hooks/usePartPracticeOverviewList";
import { useClearPartPracticeHistory } from "@/features/tests/overview/mutations/hooks/useClearPartPracticeHistory";
import { useStartPartPracticeRun } from "@/features/tests/part-practice/model/useStartPartPracticeRun";
import { useToeicCatalogQuery } from "@/entities/toeic-catalog/model/useToeicCatalogQuery";

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export function usePartPracticeOverview() {
  const searchParams = useSearchParams();
  const { status, user } = useAuthSession();
  const isAuthenticated = isAuthenticatedStatus(status);
  const [pendingClearPartNumber, setPendingClearPartNumber] = useState<
    number | null
  >(null);
  const selectedPartNumber =
    parsePracticeOverviewPartParam(searchParams.get("part")) ?? 1;

  const catalog = useToeicCatalogQuery(isAuthenticated);
  const { summaries, isLoading, error, reload } = usePartPracticeOverviewList({
    isAuthenticated,
    userId: user?.id ?? null,
    source: catalog.data,
  });

  const { startRun, isStarting, startingPartNumber } = useStartPartPracticeRun({
    userId: user?.id ?? null,
  });
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

  const startPartPractice = async (partNumber: number, mode: PracticeMode) => {
    if (!isAuthenticated || !catalog.data) {
      return;
    }

    try {
      await startRun({ partNumber, mode, source: catalog.data });
    } catch (error) {
      window.alert(getErrorMessage(error, "Cannot start part practice."));
    }
  };

  const requestClearHistory = (partNumber: number) => {
    if (!isAuthenticated) {
      return;
    }

    setPendingClearPartNumber(partNumber);
  };

  const cancelClearHistory = () => {
    if (isClearing) {
      return;
    }

    setPendingClearPartNumber(null);
  };

  const confirmClearHistory = async () => {
    if (pendingClearPartNumber == null) {
      return;
    }

    try {
      await clearHistoryMutation(pendingClearPartNumber);
      setPendingClearPartNumber(null);
    } catch (error) {
      window.alert(getErrorMessage(error, "Cannot clear part practice history."));
    }
  };

  return {
    allPartNumbers: [...ALL_TOEIC_PART_NUMBERS],
    selectedPartNumber,
    selectedSummary,
    summaries,
    isLoading: isLoading || catalog.isLoading,
    error:
      error ??
      (catalog.error
        ? getErrorMessage(catalog.error, "Cannot load TOEIC catalog.")
        : null),
    reload,
    startPartPractice,
    pendingClearPartNumber,
    requestClearHistory,
    cancelClearHistory,
    confirmClearHistory,
    isStarting,
    startingPartNumber,
    isClearing,
    clearingPartNumber,
  };
}
