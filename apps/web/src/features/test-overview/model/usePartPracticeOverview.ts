"use client";

import { useState } from "react";
import { useAuthSession, isAuthenticatedStatus } from "@/entities/session";
import type { PracticeMode, ToeicPartNumber } from "@/entities/toeic-runtime";
import { useToeicCatalogQuery } from "@/entities/toeic-catalog";
import { useClearPartPracticeHistory } from "./useClearPartPracticeHistory";
import { usePartPracticeOverviewList } from "./usePartPracticeOverviewList";
import { useStartPartPracticeRun } from "./useStartPartPracticeRun";

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export function usePartPracticeOverview(selectedPartNumber: ToeicPartNumber) {
  const { status, user } = useAuthSession();
  const isAuthenticated = isAuthenticatedStatus(status);
  const [pendingClearPartNumber, setPendingClearPartNumber] = useState<
    number | null
  >(null);

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
