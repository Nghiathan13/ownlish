"use client";

import { useState } from "react";
import { Modal } from "@/shared/ui/Modal";
import { Button } from "@/shared/ui/Button";
import { CheckIcon } from "@/shared/ui/icons/CheckIcon";
import { CloseIcon } from "@/shared/ui/icons/CloseIcon";
import { StartIcon } from "@/shared/ui/icons/StartIcon";
import { classNames } from "@/shared/lib/classNames";
import type { PracticeMode, ToeicTestSummary } from "@/features/tests/api/types";
import { practiceWrongStatClasses } from "@/features/tests/lib/practiceGradingClasses";
import { isSupportedPracticePart } from "@/features/tests/lib/partPracticeConfig";
import { getPartProgress } from "@/features/tests/lib/toeicTestProgress";
import {
  ALL_TOEIC_PART_NUMBERS,
  areAllPartsSelected,
  normalizeSelectedParts,
} from "@/features/tests/lib/toeicParts";

type PartPickerModalProps = {
  testLabel: string;
  test: ToeicTestSummary;
  isStarting?: boolean;
  onClose: () => void;
  onStart: (partNumbers: number[], mode: PracticeMode) => void;
};

const LISTENING_PARTS = [1, 2, 3, 4];
const READING_PARTS = [5, 6, 7];

function isPartEnabled(partNumber: number) {
  return isSupportedPracticePart(partNumber);
}

function addPartToSelection(current: number[], partNumber: number) {
  if (current.includes(partNumber)) {
    return current;
  }

  return [...current, partNumber];
}

function removePartFromSelection(current: number[], partNumber: number) {
  return current.filter((part) => part !== partNumber);
}

function PartCheckboxOption({
  checked,
  disabled,
  label,
  wrongCount = 0,
  onToggle,
}: {
  checked: boolean;
  disabled?: boolean;
  label: string;
  wrongCount?: number;
  onToggle: () => void;
}) {
  return (
    <button
      className={classNames(
        "flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left",
        disabled
          ? "cursor-not-allowed border-border opacity-60"
          : checked
            ? "border-foreground bg-muted/40"
            : "border-border hover:border-foreground",
      )}
      disabled={disabled}
      onClick={onToggle}
      type="button"
    >
      <span
        className={classNames(
          "flex size-5 shrink-0 items-center justify-center rounded-full border",
          checked
            ? "border-foreground bg-foreground text-background"
            : "border-border bg-background",
        )}
      >
        {checked ? <CheckIcon className="size-3" /> : null}
      </span>
      <span className="flex min-w-0 flex-1 items-center justify-between gap-2">
        <span className="text-base font-normal">{label}</span>
        {wrongCount > 0 ? (
          <span className="inline-flex shrink-0 items-center gap-1">
            <CloseIcon className={classNames("size-4", practiceWrongStatClasses)} />
            <span className={practiceWrongStatClasses}>{wrongCount}</span>
          </span>
        ) : null}
      </span>
    </button>
  );
}

export function PartPickerModal({
  testLabel,
  test,
  isStarting = false,
  onClose,
  onStart,
}: PartPickerModalProps) {
  const [selectedParts, setSelectedParts] = useState<number[]>([]);

  const isFullTest = areAllPartsSelected(selectedParts);
  const selectedWrongCount = selectedParts.reduce((total, partNumber) => {
    return total + (getPartProgress(test, partNumber)?.partWrongCount ?? 0);
  }, 0);

  const togglePart = (partNumber: number) => {
    setSelectedParts((current) =>
      current.includes(partNumber)
        ? removePartFromSelection(current, partNumber)
        : addPartToSelection(current, partNumber),
    );
  };

  const toggleFullTest = () => {
    setSelectedParts((current) => {
      if (areAllPartsSelected(current)) {
        let next = current;

        for (const partNumber of ALL_TOEIC_PART_NUMBERS) {
          next = removePartFromSelection(next, partNumber);
        }

        return next;
      }

      let next = current;

      for (const partNumber of ALL_TOEIC_PART_NUMBERS) {
        next = addPartToSelection(next, partNumber);
      }

      return next;
    });
  };

  const startWithMode = (mode: PracticeMode) => {
    const parts = normalizeSelectedParts(selectedParts);

    if (parts.length === 0) {
      return;
    }

    onStart(parts, mode);
  };

  const startLabel = isStarting
    ? "Starting..."
    : selectedParts.length > 1
      ? `Start (${selectedParts.length} parts)`
      : "Start";

  return (
    <Modal onClose={onClose} title={`Practice ${testLabel}`}>
      <div className="flex flex-col gap-4">
        <section className="flex flex-col gap-2">
          <PartCheckboxOption
            checked={isFullTest}
            label="Full test"
            onToggle={toggleFullTest}
          />
        </section>

        <section className="flex flex-col gap-2">
          <h3 className="text-base font-semibold">Listening</h3>
          <div className="grid gap-2 sm:grid-cols-2">
            {LISTENING_PARTS.map((partNumber) => {
              const enabled = isPartEnabled(partNumber);
              const partProgress = getPartProgress(test, partNumber);
              const wrongCount = partProgress?.partWrongCount ?? 0;

              return (
                <PartCheckboxOption
                  checked={selectedParts.includes(partNumber)}
                  disabled={!enabled}
                  key={partNumber}
                  label={`Part ${partNumber}`}
                  onToggle={() => enabled && togglePart(partNumber)}
                  wrongCount={enabled ? wrongCount : 0}
                />
              );
            })}
          </div>
        </section>

        <section className="flex flex-col gap-2">
          <h3 className="text-base font-semibold">Reading</h3>
          <div className="grid gap-2 sm:grid-cols-2">
            {READING_PARTS.map((partNumber) => {
              const enabled = isPartEnabled(partNumber);
              const partProgress = getPartProgress(test, partNumber);
              const wrongCount = partProgress?.partWrongCount ?? 0;

              return (
                <PartCheckboxOption
                  checked={selectedParts.includes(partNumber)}
                  disabled={!enabled}
                  key={partNumber}
                  label={`Part ${partNumber}`}
                  onToggle={() => enabled && togglePart(partNumber)}
                  wrongCount={enabled ? wrongCount : 0}
                />
              );
            })}
          </div>
        </section>

        <div className="flex flex-wrap justify-end gap-2">
          <Button
            className="px-4 py-2"
            disabled={
              isStarting ||
              selectedParts.length === 0 ||
              selectedParts.some((partNumber) => !isPartEnabled(partNumber)) ||
              selectedWrongCount === 0
            }
            onClick={() => startWithMode("review_wrong")}
            type="button"
            variant="secondary"
          >
            Review wrong{selectedWrongCount > 0 ? ` (${selectedWrongCount})` : ""}
          </Button>
          <Button
            className="gap-2 px-4 py-2"
            disabled={isStarting || selectedParts.length === 0}
            onClick={() => startWithMode("practice")}
            type="button"
          >
            <StartIcon className="size-4" />
            {startLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
