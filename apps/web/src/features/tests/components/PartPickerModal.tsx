"use client";

import { useMemo, useState } from "react";
import { Modal } from "@/shared/ui/Modal";
import { Button } from "@/shared/ui/Button";
import { CheckIcon } from "@/shared/ui/icons/CheckIcon";
import { classNames } from "@/shared/lib/classNames";
import type { PracticeMode, PracticeStats } from "@/features/tests/api/types";
import { getPartStats } from "@/features/tests/hooks/usePracticeStats";
import { isSupportedPracticePart } from "@/features/tests/lib/partPracticeConfig";
import {
  ALL_TOEIC_PART_NUMBERS,
  areAllPartsSelected,
  normalizeSelectedParts,
} from "@/features/tests/lib/toeicParts";

type PartPickerModalProps = {
  testLabel: string;
  stats: PracticeStats | null;
  isStarting?: boolean;
  onClose: () => void;
  onStart: (partNumber: number, mode: PracticeMode) => void;
  onStartMulti: (partNumbers: number[]) => void;
};

const LISTENING_PARTS = [1, 2, 3, 4];
const READING_PARTS = [5, 6, 7];

function isPartEnabled(partNumber: number) {
  return isSupportedPracticePart(partNumber);
}

function PartCheckboxOption({
  checked,
  disabled,
  label,
  description,
  onToggle,
}: {
  checked: boolean;
  disabled?: boolean;
  label: string;
  description?: string | null;
  onToggle: () => void;
}) {
  return (
    <button
      className={classNames(
        "flex w-full items-start gap-3 rounded-lg border px-3 py-2.5 text-left transition",
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
          "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border",
          checked
            ? "border-foreground bg-foreground text-background"
            : "border-border bg-background",
        )}
      >
        {checked ? <CheckIcon className="size-3" /> : null}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium">{label}</span>
        {description ? (
          <span className="mt-0.5 block text-xs text-muted-foreground">
            {description}
          </span>
        ) : null}
      </span>
    </button>
  );
}

export function PartPickerModal({
  testLabel,
  stats,
  isStarting = false,
  onClose,
  onStart,
  onStartMulti,
}: PartPickerModalProps) {
  const [selectedParts, setSelectedParts] = useState<number[]>([1]);

  const normalizedSelectedParts = useMemo(
    () => normalizeSelectedParts(selectedParts),
    [selectedParts],
  );
  const isFullTest = areAllPartsSelected(normalizedSelectedParts);
  const isSinglePart = normalizedSelectedParts.length === 1;
  const singlePartNumber = isSinglePart ? normalizedSelectedParts[0] : null;
  const singlePartStats =
    singlePartNumber !== null ? getPartStats(stats, singlePartNumber) : null;
  const wrongQuestionCount = singlePartStats?.wrongQuestionCount ?? 0;

  const setFullTestSelection = (checked: boolean) => {
    setSelectedParts(checked ? [...ALL_TOEIC_PART_NUMBERS] : []);
  };

  const togglePart = (partNumber: number) => {
    setSelectedParts((current) => {
      const next = new Set(current);

      if (next.has(partNumber)) {
        next.delete(partNumber);
      } else {
        next.add(partNumber);
      }

      return normalizeSelectedParts(Array.from(next));
    });
  };

  const handleStart = () => {
    if (normalizedSelectedParts.length === 0) {
      return;
    }

    if (normalizedSelectedParts.length === 1) {
      onStart(normalizedSelectedParts[0]!, "normal");
      return;
    }

    onStartMulti(normalizedSelectedParts);
  };

  return (
    <Modal
      description="Choose one or more parts to practice."
      onClose={onClose}
      title={`Practice ${testLabel}`}
    >
      <div className="space-y-6">
        <section>
          <PartCheckboxOption
            checked={isFullTest}
            description="All 7 parts"
            label="Full test"
            onToggle={() => setFullTestSelection(!isFullTest)}
          />
        </section>

        <section>
          <h3 className="mb-3 text-sm font-semibold">Listening</h3>
          <div className="grid gap-2 sm:grid-cols-2">
            {LISTENING_PARTS.map((partNumber) => {
              const enabled = isPartEnabled(partNumber);
              const partStats = getPartStats(stats, partNumber);
              const wrongCount = partStats?.wrongQuestionCount ?? 0;

              return (
                <PartCheckboxOption
                  checked={normalizedSelectedParts.includes(partNumber)}
                  description={
                    enabled && wrongCount > 0
                      ? `${wrongCount} wrong to review`
                      : null
                  }
                  disabled={!enabled}
                  key={partNumber}
                  label={`Part ${partNumber}`}
                  onToggle={() => enabled && togglePart(partNumber)}
                />
              );
            })}
          </div>
        </section>

        <section>
          <h3 className="mb-3 text-sm font-semibold">Reading</h3>
          <div className="grid gap-2 sm:grid-cols-2">
            {READING_PARTS.map((partNumber) => {
              const enabled = isPartEnabled(partNumber);
              const partStats = getPartStats(stats, partNumber);
              const wrongCount = partStats?.wrongQuestionCount ?? 0;

              return (
                <PartCheckboxOption
                  checked={normalizedSelectedParts.includes(partNumber)}
                  description={
                    enabled && wrongCount > 0
                      ? `${wrongCount} wrong to review`
                      : null
                  }
                  disabled={!enabled}
                  key={partNumber}
                  label={`Part ${partNumber}`}
                  onToggle={() => enabled && togglePart(partNumber)}
                />
              );
            })}
          </div>
        </section>

        <div className="flex flex-wrap justify-end gap-2">
          <Button disabled={isStarting} onClick={onClose} type="button" variant="secondary">
            Cancel
          </Button>
          <Button
            disabled={
              isStarting ||
              !isSinglePart ||
              singlePartNumber === null ||
              !isPartEnabled(singlePartNumber) ||
              wrongQuestionCount === 0
            }
            onClick={() => {
              if (singlePartNumber !== null) {
                onStart(singlePartNumber, "wrong_questions");
              }
            }}
            type="button"
            variant="secondary"
          >
            Review wrong{wrongQuestionCount > 0 ? ` (${wrongQuestionCount})` : ""}
          </Button>
          <Button
            disabled={
              isStarting || normalizedSelectedParts.length === 0
            }
            onClick={handleStart}
            type="button"
          >
            {isStarting
              ? "Starting..."
              : normalizedSelectedParts.length > 1
                ? `Start (${normalizedSelectedParts.length} parts)`
                : "Start"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
