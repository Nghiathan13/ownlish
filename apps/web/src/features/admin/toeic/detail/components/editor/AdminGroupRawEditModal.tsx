"use client";

import { useEffect, useId, useState } from "react";
import type { AdminGroupEditorState } from "@/features/admin/toeic/detail/lib/adminGroupEditorState";
import {
  parseAdminGroupRawEdit,
  serializeAdminGroupRawEdit,
} from "@/features/admin/toeic/detail/lib/adminGroupRawEdit";
import type { AdminGroupRawEditMode } from "@/features/admin/toeic/detail/lib/adminGroupRawEditTypes";
import {
  primaryTextButtonClassName,
  secondaryTextButtonClassName,
} from "@/shared/ui/button";

type AdminGroupRawEditModalProps = {
  draft: AdminGroupEditorState;
  partNumber: number;
  initialJson: string;
  initialTxt: string;
  isSaving: boolean;
  error: string | null;
  onClose: () => void;
  onErrorChange: (error: string | null) => void;
  onSave: (text: string, mode: AdminGroupRawEditMode) => void;
};

function getInitialText(mode: AdminGroupRawEditMode, initialJson: string, initialTxt: string) {
  return mode === "txt" ? initialTxt : initialJson;
}

export function AdminGroupRawEditModal({
  draft,
  partNumber,
  initialJson,
  initialTxt,
  isSaving,
  error,
  onClose,
  onErrorChange,
  onSave,
}: AdminGroupRawEditModalProps) {
  const titleId = useId();
  const [mode, setMode] = useState<AdminGroupRawEditMode>("json");
  const [text, setText] = useState(() => getInitialText("json", initialJson, initialTxt));

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isSaving) {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isSaving, onClose]);

  const handleModeChange = (nextMode: AdminGroupRawEditMode) => {
    if (nextMode === mode || isSaving) {
      return;
    }

    const parsed = parseAdminGroupRawEdit(text, draft, partNumber, mode);
    if (!parsed.ok) {
      onErrorChange(parsed.error);
      return;
    }

    setMode(nextMode);
    setText(serializeAdminGroupRawEdit(parsed.state, partNumber, nextMode));
    onErrorChange(null);
  };

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
        <div
          className="flex items-center justify-center gap-2"
          id={titleId}
          role="tablist"
        >
          <button
            aria-selected={mode === "txt"}
            className={
              mode === "txt"
                ? "rounded-md bg-foreground px-3 py-1 text-sm font-semibold uppercase tracking-wide text-background"
                : "rounded-md px-3 py-1 text-sm font-semibold uppercase tracking-wide text-muted-foreground hover:text-foreground"
            }
            disabled={isSaving}
            onClick={() => handleModeChange("txt")}
            role="tab"
            type="button"
          >
            TXT
          </button>
          <button
            aria-selected={mode === "json"}
            className={
              mode === "json"
                ? "rounded-md bg-foreground px-3 py-1 text-sm font-semibold uppercase tracking-wide text-background"
                : "rounded-md px-3 py-1 text-sm font-semibold uppercase tracking-wide text-muted-foreground hover:text-foreground"
            }
            disabled={isSaving}
            onClick={() => handleModeChange("json")}
            role="tab"
            type="button"
          >
            JSON
          </button>
        </div>

        <textarea
          className="h-[min(480px,calc(100dvh-12rem))] w-full resize-none overflow-y-auto break-words rounded-lg border border-border bg-background p-4 font-mono text-sm text-foreground whitespace-pre-wrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          disabled={isSaving}
          onChange={(event) => {
            setText(event.target.value);
            if (error) {
              onErrorChange(null);
            }
          }}
          spellCheck={false}
          value={text}
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
            onClick={() => onSave(text, mode)}
            type="button"
          >
            {isSaving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
