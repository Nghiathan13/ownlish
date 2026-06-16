"use client";

import { Modal } from "@/shared/ui/Modal";
import { Button } from "@/shared/ui/Button";
import { classNames } from "@/shared/lib/classNames";

type PartPickerModalProps = {
  testLabel: string;
  onClose: () => void;
  onStart: (partNumber: number) => void;
};

const LISTENING_PARTS = [1, 2, 3, 4];
const READING_PARTS = [5, 6, 7];

export function PartPickerModal({
  testLabel,
  onClose,
  onStart,
}: PartPickerModalProps) {
  return (
    <Modal
      description="Chọn part để luyện tập."
      onClose={onClose}
      title={`Practice ${testLabel}`}
    >
      <div className="space-y-6">
        <section>
          <h3 className="mb-3 text-sm font-semibold">Listening</h3>
          <div className="grid gap-2 sm:grid-cols-2">
            {LISTENING_PARTS.map((partNumber) => {
              const enabled = partNumber === 1;
              return (
                <button
                  className={classNames(
                    "rounded-lg border px-3 py-2 text-left text-sm font-medium transition",
                    enabled
                      ? "border-foreground bg-foreground text-background"
                      : "cursor-not-allowed border-border text-muted-foreground opacity-60",
                  )}
                  disabled={!enabled}
                  key={partNumber}
                  onClick={() => enabled && onStart(partNumber)}
                  type="button"
                >
                  Part {partNumber}
                  {!enabled ? " · Coming soon" : ""}
                </button>
              );
            })}
          </div>
        </section>

        <section>
          <h3 className="mb-3 text-sm font-semibold">Reading</h3>
          <div className="grid gap-2 sm:grid-cols-2">
            {READING_PARTS.map((partNumber) => (
              <button
                className="cursor-not-allowed rounded-lg border border-border px-3 py-2 text-left text-sm font-medium text-muted-foreground opacity-60"
                disabled
                key={partNumber}
                type="button"
              >
                Part {partNumber} · Coming soon
              </button>
            ))}
          </div>
        </section>

        <div className="flex justify-end">
          <Button onClick={onClose} type="button" variant="secondary">
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  );
}
