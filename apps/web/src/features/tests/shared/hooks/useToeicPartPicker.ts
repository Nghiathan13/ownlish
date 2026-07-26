"use client";

import { useState } from "react";
import type { PracticeMode } from "@/entities/toeic-runtime/model/presentation";
import type { CatalogTestSummary } from "@/features/tests/shared/model/catalogTestSummary";
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
import { getMockTimeLimitMinutes } from "@/features/tests/shared/lib/mockTestTimer";

type UsePartPickerParams = {
  intent: "practice" | "mock";
  isStarting: boolean;
  onStart: (partNumbers: number[], mode: PracticeMode) => void;
  onStartMock?: (partNumbers: number[], timeLimitMinutes: number) => void;
  test: CatalogTestSummary;
};

export function useToeicPartPicker({
  intent,
  isStarting,
  onStart,
  onStartMock,
  test,
}: UsePartPickerParams) {
  const [selectedParts, setSelectedParts] = useState<number[]>([]);
  const [mockTimeLimitInput, setMockTimeLimitInput] = useState("");

  const areAllPartsChecked = areAllPartsSelected(selectedParts);
  const selectedWrongCount = selectedParts.reduce((total, partNumber) => {
    return total + (getPartProgress(test, partNumber)?.partWrongCount ?? 0);
  }, 0);
  const hasUnsupportedPart = selectedParts.some(
    (partNumber) => !isPartEnabled(partNumber),
  );

  const togglePart = (partNumber: number) => {
    const nextParts = selectedParts.includes(partNumber)
      ? removePartFromSelection(selectedParts, partNumber)
      : addPartToSelection(selectedParts, partNumber);
    setSelectedParts(nextParts);
    setMockTimeLimitInput(String(getMockTimeLimitMinutes(nextParts)));
  };

  const toggleAllParts = () => {
    const nextParts = areAllPartsChecked ? [] : [...ALL_TOEIC_PART_NUMBERS];
    setSelectedParts(nextParts);
    setMockTimeLimitInput(String(getMockTimeLimitMinutes(nextParts)));
  };

  const startWithMode = (mode: PracticeMode) => {
    const parts = normalizeSelectedParts(selectedParts);

    if (parts.length === 0) {
      return;
    }

    onStart(parts, mode);
  };

  const startMock = (timeLimitMinutes: number) => {
    const parts = normalizeSelectedParts(selectedParts);

    if (parts.length === 0) {
      return;
    }

    onStartMock?.(parts, timeLimitMinutes);
  };

  return {
    areAllPartsChecked,
    intent,
    isPracticeDisabled: isStarting || selectedParts.length === 0,
    isReviewWrongDisabled:
      isStarting ||
      selectedParts.length === 0 ||
      hasUnsupportedPart ||
      selectedWrongCount === 0,
    isStarting,
    mockTimeLimitInput,
    selectedParts,
    selectedWrongCount,
    startMock,
    startWithMode,
    setMockTimeLimitInput,
    toggleAllParts,
    togglePart,
  };
}
