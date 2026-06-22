"use client";

import { Modal } from "@/shared/ui/Modal";
import {
  iconTextButtonClassName,
  secondaryTextButtonClassName,
} from "@/shared/ui/button";
import { CheckIcon } from "@/shared/ui/icons/CheckIcon";
import { CloseIcon } from "@/shared/ui/icons/CloseIcon";
import { StartIcon } from "@/shared/ui/icons/StartIcon";
import { classNames } from "@/shared/lib/classNames";
import type {
  PracticeMode,
  ToeicTestSummary,
} from "@/features/tests/shared/api/types";
import { useToeicPartPicker } from "@/features/tests/shared/hooks/useToeicPartPicker";
import { getPartProgress } from "@/features/tests/shared/lib/toeicTestProgress";
import { statusColorClasses } from "@/shared/ui/theme/statusColors";
import {
  LISTENING_PARTS,
  READING_PARTS,
} from "@/features/tests/shared/constants/toeicPartPicker";
import { isPartEnabled } from "@/features/tests/shared/lib/toeicPartPicker";

type ToeicPartPickerModalProps = {
  intent?: "practice" | "mock";
  testLabel: string;
  test: ToeicTestSummary;
  isStarting?: boolean;
  onClose: () => void;
  onStart: (partNumbers: number[], mode: PracticeMode) => void;
  onStartMock?: (partNumbers: number[]) => void;
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
        "flex w-full items-center gap-2 rounded-lg border px-4 py-2 text-left",
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

export function ToeicPartPickerModal({
  intent = "practice",
  testLabel,
  test,
  isStarting = false,
  onClose,
  onStart,
  onStartMock,
}: ToeicPartPickerModalProps) {
  const partPicker = useToeicPartPicker({
    intent,
    isStarting,
    onStart,
    onStartMock,
    test,
  });
  const showsWrongProgress = partPicker.intent === "practice";

  return (
    <Modal
      onClose={onClose}
      title={`${partPicker.intent === "mock" ? "Mock" : "Practice"} ${testLabel}`}
    >
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
                  wrongCount={showsWrongProgress && enabled ? wrongCount : 0}
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
                  wrongCount={showsWrongProgress && enabled ? wrongCount : 0}
                />
              );
            })}
          </div>
        </section>

        <div className="flex flex-wrap justify-end gap-2">
          {partPicker.intent === "practice" ? (
            <button
              className={secondaryTextButtonClassName()}
              disabled={partPicker.isReviewWrongDisabled}
              onClick={() => partPicker.startWithMode("review_wrong")}
              type="button"
            >
              Review wrong
              {partPicker.selectedWrongCount > 0
                ? ` (${partPicker.selectedWrongCount})`
                : ""}
            </button>
          ) : null}
          <button
            className={iconTextButtonClassName(
              "border-foreground bg-foreground text-background",
            )}
            disabled={partPicker.isPracticeDisabled}
            onClick={() => {
              if (partPicker.intent === "mock") {
                partPicker.startMock();
                return;
              }

              partPicker.startWithMode("practice");
            }}
            type="button"
          >
            <StartIcon />
            {partPicker.startLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
