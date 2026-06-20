"use client";

import { Modal } from "@/shared/ui/Modal";
import { Button } from "@/shared/ui/Button";
import { CheckIcon } from "@/shared/ui/icons/CheckIcon";
import { CloseIcon } from "@/shared/ui/icons/CloseIcon";
import { StartIcon } from "@/shared/ui/icons/StartIcon";
import { classNames } from "@/shared/lib/classNames";
import type {
  PracticeMode,
  ToeicTestSummary,
} from "@/features/tests/shared/api/types";
import { usePartPicker } from "@/features/tests/overview/hooks/usePartPicker";
import { getPartProgress } from "@/features/tests/overview/lib/toeicTestProgress";
import { statusColorClasses } from "@/shared/ui/theme/statusColors";
import {
  isPartEnabled,
  LISTENING_PARTS,
  READING_PARTS,
} from "@/features/tests/overview/lib/toeicPartPicker";

type PartPickerModalProps = {
  testLabel: string;
  test: ToeicTestSummary;
  isStarting?: boolean;
  onClose: () => void;
  onStart: (partNumbers: number[], mode: PracticeMode) => void;
};

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
        {checked ? <CheckIcon className="size-4" /> : null}
      </span>
      <span className="flex min-w-0 flex-1 items-center justify-between gap-2">
        <span className="text-base font-normal">{label}</span>
        {wrongCount > 0 ? (
          <span className="inline-flex shrink-0 items-center gap-1">
            <CloseIcon
              className={classNames("size-4", statusColorClasses.danger.text)}
            />
            <span className={statusColorClasses.danger.text}>{wrongCount}</span>
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
  const partPicker = usePartPicker({ isStarting, onStart, test });

  return (
    <Modal onClose={onClose} title={`Practice ${testLabel}`}>
      <div className="flex flex-col gap-4">
        <section className="flex flex-col gap-2">
          <PartCheckboxOption
            checked={partPicker.areAllPartsChecked}
            label="All parts"
            onToggle={partPicker.toggleAllParts}
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
                  checked={partPicker.selectedParts.includes(partNumber)}
                  disabled={!enabled}
                  key={partNumber}
                  label={`Part ${partNumber}`}
                  onToggle={() => enabled && partPicker.togglePart(partNumber)}
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
                  checked={partPicker.selectedParts.includes(partNumber)}
                  disabled={!enabled}
                  key={partNumber}
                  label={`Part ${partNumber}`}
                  onToggle={() => enabled && partPicker.togglePart(partNumber)}
                  wrongCount={enabled ? wrongCount : 0}
                />
              );
            })}
          </div>
        </section>

        <div className="flex flex-wrap justify-end gap-2">
          <Button
            className="px-4 py-2"
            disabled={partPicker.isReviewWrongDisabled}
            onClick={() => partPicker.startWithMode("review_wrong")}
            type="button"
            variant="secondary"
          >
            Review wrong
            {partPicker.selectedWrongCount > 0
              ? ` (${partPicker.selectedWrongCount})`
              : ""}
          </Button>
          <Button
            className="gap-2 px-4 py-2"
            disabled={partPicker.isPracticeDisabled}
            onClick={() => partPicker.startWithMode("practice")}
            type="button"
          >
            <StartIcon className="size-5" />
            {partPicker.startLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
