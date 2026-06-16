"use client";

import { useState } from "react";
import { Modal } from "@/shared/ui/Modal";
import { Button } from "@/shared/ui/Button";
import { classNames } from "@/shared/lib/classNames";
import type { PracticeMode, PracticeStats } from "@/features/tests/api/types";
import { getPartStats } from "@/features/tests/hooks/usePracticeStats";
import { isSupportedPracticePart } from "@/features/tests/lib/partPracticeConfig";

type PartPickerModalProps = {
  testLabel: string;
  stats: PracticeStats | null;
  onClose: () => void;
  onStart: (partNumber: number, mode: PracticeMode) => void;
};

const LISTENING_PARTS = [1, 2, 3, 4];
const READING_PARTS = [5, 6, 7];

function isPartEnabled(partNumber: number) {
  return isSupportedPracticePart(partNumber);
}

function PartOptionButton({
  partNumber,
  enabled,
  isSelected,
  wrongQuestionCount,
  onSelect,
}: {
  partNumber: number;
  enabled: boolean;
  isSelected: boolean;
  wrongQuestionCount: number;
  onSelect: () => void;
}) {
  return (
    <button
      className={classNames(
        "rounded-lg border px-3 py-2 text-left text-sm font-medium transition",
        enabled
          ? isSelected
            ? "border-foreground bg-foreground text-background"
            : "border-border hover:border-foreground"
          : "cursor-not-allowed border-border text-muted-foreground opacity-60",
      )}
      disabled={!enabled}
      onClick={onSelect}
      type="button"
    >
      <span className="block">Part {partNumber}</span>
      {enabled && wrongQuestionCount > 0 ? (
        <span
          className={classNames(
            "mt-1 block text-xs",
            isSelected ? "text-background/80" : "text-muted-foreground",
          )}
        >
          {wrongQuestionCount} wrong to review
        </span>
      ) : null}
    </button>
  );
}

export function PartPickerModal({
  testLabel,
  stats,
  onClose,
  onStart,
}: PartPickerModalProps) {
  const [selectedPart, setSelectedPart] = useState<number | null>(1);
  const selectedPartStats =
    selectedPart !== null ? getPartStats(stats, selectedPart) : null;
  const wrongQuestionCount = selectedPartStats?.wrongQuestionCount ?? 0;

  return (
    <Modal
      description="Choose a part to practice."
      onClose={onClose}
      title={`Practice ${testLabel}`}
    >
      <div className="space-y-6">
        <section>
          <h3 className="mb-3 text-sm font-semibold">Listening</h3>
          <div className="grid gap-2 sm:grid-cols-2">
            {LISTENING_PARTS.map((partNumber) => {
              const enabled = isPartEnabled(partNumber);
              const partStats = getPartStats(stats, partNumber);

              return (
                <PartOptionButton
                  enabled={enabled}
                  isSelected={selectedPart === partNumber}
                  key={partNumber}
                  onSelect={() => enabled && setSelectedPart(partNumber)}
                  partNumber={partNumber}
                  wrongQuestionCount={partStats?.wrongQuestionCount ?? 0}
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

              return (
                <PartOptionButton
                  enabled={enabled}
                  isSelected={selectedPart === partNumber}
                  key={partNumber}
                  onSelect={() => enabled && setSelectedPart(partNumber)}
                  partNumber={partNumber}
                  wrongQuestionCount={partStats?.wrongQuestionCount ?? 0}
                />
              );
            })}
          </div>
        </section>

        <div className="flex flex-wrap justify-end gap-2">
          <Button onClick={onClose} type="button" variant="secondary">
            Cancel
          </Button>
          <Button
            disabled={
              selectedPart === null ||
              !isPartEnabled(selectedPart) ||
              wrongQuestionCount === 0
            }
            onClick={() => {
              if (selectedPart !== null) {
                onStart(selectedPart, "wrong_questions");
              }
            }}
            type="button"
            variant="secondary"
          >
            Review wrong{wrongQuestionCount > 0 ? ` (${wrongQuestionCount})` : ""}
          </Button>
          <Button
            disabled={selectedPart === null || !isPartEnabled(selectedPart)}
            onClick={() => {
              if (selectedPart !== null) {
                onStart(selectedPart, "normal");
              }
            }}
            type="button"
          >
            Start
          </Button>
        </div>
      </div>
    </Modal>
  );
}
