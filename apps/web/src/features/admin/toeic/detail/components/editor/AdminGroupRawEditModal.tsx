"use client";

import { useEffect, useId, useState } from "react";
import { CloseIcon } from "@/shared/ui/icons/CloseIcon";
import {
  iconOnlyButtonClassName,
  primaryTextButtonClassName,
  secondaryTextButtonClassName,
} from "@/shared/ui/button";

type AdminGroupRawEditModalProps = {
  initialJson: string;
  isSaving: boolean;
  error: string | null;
  onClose: () => void;
  onSave: (jsonText: string) => void;
};

export function AdminGroupRawEditModal({
  initialJson,
  isSaving,
  error,
  onClose,
  onSave,
}: AdminGroupRawEditModalProps) {
  const titleId = useId();
  const [jsonText, setJsonText] = useState(initialJson);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isSaving) {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isSaving, onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm"
      role="presentation"
      onMouseDown={isSaving ? undefined : onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="flex w-full max-w-4xl flex-col gap-4 rounded-xl border border-border bg-background p-6 shadow-2xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1" />
          <p
            id={titleId}
            className="text-sm font-semibold uppercase tracking-wide text-muted-foreground"
          >
            JSON
          </p>
          <div className="flex flex-1 justify-end">
            <button
              aria-label="Close"
              className={iconOnlyButtonClassName(
                "border border-border bg-transparent text-foreground hover:border-foreground",
              )}
              disabled={isSaving}
              onClick={onClose}
              type="button"
            >
              <CloseIcon />
            </button>
          </div>
        </div>

        <textarea
          className="h-[min(480px,calc(100dvh-12rem))] w-full resize-none overflow-y-auto break-words rounded-lg border border-border bg-background p-4 font-mono text-sm text-foreground whitespace-pre-wrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          disabled={isSaving}
          onChange={(event) => setJsonText(event.target.value)}
          spellCheck={false}
          value={jsonText}
        />

        {error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : null}

        <div className="flex justify-end gap-2">
          <button
            className={secondaryTextButtonClassName()}
            disabled={isSaving}
            onClick={onClose}
            type="button"
          >
            Cancel
          </button>
          <button
            className={primaryTextButtonClassName()}
            disabled={isSaving}
            onClick={() => onSave(jsonText)}
            type="button"
          >
            {isSaving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
