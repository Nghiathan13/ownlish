"use client";

import { useState } from "react";
import type {
  PracticeMode,
  ToeicTestSummary,
} from "@/features/tests/shared/api/types";
import { getPartProgress } from "@/features/tests/shared/lib/toeicTestProgress";
import {
  addPartToSelection,
  isPartEnabled,
  removePartFromSelection,
} from "@/features/tests/shared/lib/toeicPartPicker";
import {
  ALL_TOEIC_PART_NUMBERS,
  areAllPartsSelected,
  normalizeSelectedParts,
} from "@/features/tests/shared/lib/toeicParts";

type UsePartPickerParams = {
  intent: "practice" | "mock";
  isStarting: boolean;
  onStart: (partNumbers: number[], mode: PracticeMode) => void;
  onStartMock?: (partNumbers: number[]) => void;
  test: ToeicTestSummary;
};

export function useToeicPartPicker({
  intent,
  isStarting,
  onStart,
  onStartMock,
  test,
}: UsePartPickerParams) {
  const [selectedParts, setSelectedParts] = useState<number[]>([]);

  const areAllPartsChecked = areAllPartsSelected(selectedParts);
  const selectedWrongCount = selectedParts.reduce((total, partNumber) => {
    return total + (getPartProgress(test, partNumber)?.partWrongCount ?? 0);
  }, 0);
  const hasUnsupportedPart = selectedParts.some(
    (partNumber) => !isPartEnabled(partNumber),
  );

  const togglePart = (partNumber: number) => {
    setSelectedParts((current) =>
      current.includes(partNumber)
        ? removePartFromSelection(current, partNumber)
        : addPartToSelection(current, partNumber),
    );
  };

  const toggleAllParts = () => {
    setSelectedParts((current) => {
      if (areAllPartsSelected(current)) {
        return [];
      }

      return [...ALL_TOEIC_PART_NUMBERS];
    });
  };

  const startWithMode = (mode: PracticeMode) => {
    const parts = normalizeSelectedParts(selectedParts);

    if (parts.length === 0) {
      return;
    }

    onStart(parts, mode);
  };

  const startMock = () => {
    const parts = normalizeSelectedParts(selectedParts);

    if (parts.length === 0) {
      return;
    }

    onStartMock?.(parts);
  };

  const startLabel = isStarting
    ? "Starting..."
    : selectedParts.length > 1
      ? `Start (${selectedParts.length} parts)`
      : "Start";

  return {
    areAllPartsChecked,
    intent,
    isPracticeDisabled: isStarting || selectedParts.length === 0,
    isReviewWrongDisabled:
      isStarting ||
      selectedParts.length === 0 ||
      hasUnsupportedPart ||
      selectedWrongCount === 0,
    selectedParts,
    selectedWrongCount,
    startMock,
    startLabel,
    startWithMode,
    toggleAllParts,
    togglePart,
  };
}
