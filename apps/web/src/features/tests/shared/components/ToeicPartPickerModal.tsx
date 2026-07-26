"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/shared/ui/Modal";
import { iconTextButtonClassName } from "@/shared/ui/button";
import { CheckIcon } from "@/shared/ui/icons/CheckIcon";
import { CloseIcon } from "@/shared/ui/icons/CloseIcon";
import { StartIcon } from "@/shared/ui/icons/StartIcon";
import { classNames } from "@/shared/lib/classNames";
import type { PracticeMode } from "@/entities/toeic-runtime/model/presentation";
import type { CatalogTestSummary } from "@/features/tests/shared/model/catalogTestSummary";
import { useToeicPartPicker } from "@/features/tests/shared/hooks/useToeicPartPicker";
import { getPartProgress } from "@/features/tests/shared/lib/toeicTestProgress";
import { statusColorClasses } from "@/shared/ui/theme/statusColors";
import {
  LISTENING_PARTS,
  READING_PARTS,
} from "@/features/tests/shared/constants/toeicPartPicker";
import { isPartEnabled } from "@/features/tests/shared/lib/toeicPartPicker";
import { formatMessage } from "@/shared/i18n/messages";
import { useT } from "@/shared/providers/LocaleProvider";

type PartPickerIntent = "practice" | "mock";

type ToeicPartPickerModalProps = {
  intent?: PartPickerIntent;
  testLabel: string;
  test: CatalogTestSummary;
  isStarting?: boolean;
  onClose: () => void;
  onStart: (partNumbers: number[], mode: PracticeMode) => void;
  onStartMock?: (partNumbers: number[], timeLimitMinutes: number) => void;
};

const modeToggleButtonClassName =
  "inline-flex flex-1 shrink-0 cursor-pointer items-center justify-center rounded-[4px] px-2 py-1 text-[15px] leading-[20px] font-normal";

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
            ? "cursor-pointer border-foreground bg-muted/40 hover:[box-shadow:inset_0_0_0_9999px_var(--hover-overlay)]"
            : "cursor-pointer border-border hover:bg-hover-overlay",
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
            : "border-border bg-transparent",
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

function ModeToggle({
  intent,
  onIntentChange,
}: {
  intent: PartPickerIntent;
  onIntentChange: (intent: PartPickerIntent) => void;
}) {
  const t = useT();

  return (
    <div
      aria-label={`${t("tests.mock")} / ${t("tests.practice")}`}
      className="flex w-full gap-1 rounded-[8px] border border-border bg-surface p-1"
      role="tablist"
    >
      {(
        [
          { value: "mock", label: t("tests.mock") },
          { value: "practice", label: t("tests.practice") },
        ] as const
      ).map((option) => {
        const isActive = intent === option.value;

        return (
          <button
            aria-selected={isActive}
            className={classNames(
              modeToggleButtonClassName,
              isActive
                ? "bg-muted text-foreground hover:[box-shadow:inset_0_0_0_9999px_var(--hover-overlay)]"
                : "bg-transparent text-foreground hover:bg-hover-overlay",
            )}
            key={option.value}
            onClick={() => onIntentChange(option.value)}
            role="tab"
            type="button"
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export function ToeicPartPickerModal({
  intent: initialIntent = "practice",
  testLabel,
  test,
  isStarting = false,
  onClose,
  onStart,
  onStartMock,
}: ToeicPartPickerModalProps) {
  const t = useT();
  const [intent, setIntent] = useState<PartPickerIntent>(initialIntent);

  useEffect(() => {
    let isActive = true;

    queueMicrotask(() => {
      if (isActive) {
        setIntent(initialIntent);
      }
    });

    return () => {
      isActive = false;
    };
  }, [initialIntent]);

  const partPicker = useToeicPartPicker({
    intent,
    isStarting,
    onStart,
    onStartMock,
    test,
  });
  const showsWrongProgress = intent === "practice";
  const startLabel = partPicker.isStarting
    ? t("tests.starting")
    : partPicker.selectedParts.length > 1
      ? formatMessage(t("tests.startParts"), {
          count: partPicker.selectedParts.length,
        })
      : t("tests.start");
  const title = formatMessage(
    t(intent === "mock" ? "tests.mockTitle" : "tests.practiceTitle"),
    { label: testLabel },
  );
  const mockTimeLimitMinutes = Number(partPicker.mockTimeLimitInput);
  const isMockTimeLimitValid =
    Number.isInteger(mockTimeLimitMinutes) &&
    mockTimeLimitMinutes >= 1 &&
    mockTimeLimitMinutes <= 180;

  return (
    <Modal
      className="border-0 bg-surface dark:border dark:border-border"
      onClose={onClose}
      title={title}
    >
      <div className="flex flex-col gap-4">
        <ModeToggle intent={intent} onIntentChange={setIntent} />

        <section className="flex flex-col gap-2">
          <PartCheckboxOption
            checked={partPicker.areAllPartsChecked}
            label={t("tests.allParts")}
            onToggle={partPicker.toggleAllParts}
          />
        </section>

        <section className="flex flex-col gap-2">
          <h3 className="text-base font-semibold">{t("tests.listening")}</h3>
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
                  label={formatMessage(t("tests.partNumber"), {
                    number: partNumber,
                  })}
                  onToggle={() => enabled && partPicker.togglePart(partNumber)}
                  wrongCount={showsWrongProgress && enabled ? wrongCount : 0}
                />
              );
            })}
          </div>
        </section>

        <section className="flex flex-col gap-2">
          <h3 className="text-base font-semibold">{t("tests.reading")}</h3>
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
                  label={formatMessage(t("tests.partNumber"), {
                    number: partNumber,
                  })}
                  onToggle={() => enabled && partPicker.togglePart(partNumber)}
                  wrongCount={showsWrongProgress && enabled ? wrongCount : 0}
                />
              );
            })}
          </div>
        </section>

        {intent === "mock" ? (
          <div className="flex items-center justify-between rounded-lg border border-border bg-transparent px-4 py-2 text-[15px] leading-5">
            <span>{t("tests.timeLimit")}</span>
            <label className="flex items-center gap-2">
              <input
                aria-label={t("tests.timeLimit")}
                className="w-16 rounded-md border border-border bg-transparent px-2 py-1 text-center font-mono text-sm font-semibold tabular-nums outline-none focus:border-primary"
                disabled={partPicker.isStarting}
                inputMode="numeric"
                maxLength={3}
                onChange={(event) => {
                  const nextValue = event.target.value;
                  const nextNumber = Number(nextValue);

                  if (
                    nextValue !== "" &&
                    Number.isInteger(nextNumber) &&
                    nextNumber > 180
                  ) {
                    partPicker.setMockTimeLimitInput("180");
                    return;
                  }

                  partPicker.setMockTimeLimitInput(nextValue);
                }}
                value={partPicker.mockTimeLimitInput}
              />
              <span>{t("tests.minutes")}</span>
            </label>
          </div>
        ) : null}

        <div className="flex flex-wrap justify-end gap-2">
          {intent === "practice" && partPicker.selectedWrongCount > 0 ? (
            <button
              className={iconTextButtonClassName(
                "border-border bg-transparent text-foreground hover:bg-hover-overlay",
              )}
              disabled={partPicker.isReviewWrongDisabled}
              onClick={() => partPicker.startWithMode("review_wrong")}
              type="button"
            >
              {t("tests.reviewWrong")} ({partPicker.selectedWrongCount})
            </button>
          ) : null}
          <button
            className={iconTextButtonClassName(
              "border-foreground bg-foreground text-background hover:[box-shadow:inset_0_0_0_9999px_var(--hover-overlay-solid)]",
            )}
            disabled={
              partPicker.isPracticeDisabled ||
              (intent === "mock" && !isMockTimeLimitValid)
            }
            onClick={() => {
              if (intent === "mock") {
                partPicker.startMock(mockTimeLimitMinutes);
                return;
              }

              partPicker.startWithMode("practice");
            }}
            type="button"
          >
            <StartIcon />
            {startLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
