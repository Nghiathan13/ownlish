"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { AdminConfirmDialog } from "@/features/admin/toeic/detail/components/editor/AdminConfirmDialog";
import type { AdminGroupEditorState } from "@/features/admin/toeic/detail/lib/adminGroupEditorState";
import {
  parseAdminGroupRawEditRange,
  serializeAdminGroupRawEditRange,
} from "@/features/admin/toeic/detail/lib/adminGroupRawEditMulti";
import type { AdminGroupRawEditMode } from "@/features/admin/toeic/detail/lib/adminGroupRawEditTypes";
import {
  normalizeGroupRangeInputs,
  type AdminGroupRange,
} from "@/features/admin/toeic/detail/lib/adminGroupRawEditRange";
import type { AdminToeicGroupCatalogEntry } from "@/features/admin/toeic/detail/lib/adminToeicGroupCatalog";
import {
  primaryTextButtonClassName,
  secondaryTextButtonClassName,
} from "@/shared/ui/button";

type AdminGroupRawEditModalProps = {
  catalog: AdminToeicGroupCatalogEntry[];
  currentGroupDraft?: AdminGroupEditorState;
  initialGroupIndex: number;
  isSaving: boolean;
  error: string | null;
  onClose: () => void;
  onErrorChange: (error: string | null) => void;
  onSave: (text: string, mode: AdminGroupRawEditMode, range: AdminGroupRange) => void;
};

function buildStateOverrides(
  catalog: AdminToeicGroupCatalogEntry[],
  range: AdminGroupRange,
  currentGroupDraft?: AdminGroupEditorState,
) {
  if (!currentGroupDraft) {
    return undefined;
  }

  const entry = catalog.find((item) => item.group.id === currentGroupDraft.groupId);

  if (!entry || entry.groupIndex < range.from || entry.groupIndex > range.to) {
    return undefined;
  }

  return new Map([[currentGroupDraft.groupId, currentGroupDraft]]);
}

function serializeRangeText(
  catalog: AdminToeicGroupCatalogEntry[],
  range: AdminGroupRange,
  mode: AdminGroupRawEditMode,
  currentGroupDraft?: AdminGroupEditorState,
) {
  return serializeAdminGroupRawEditRange(
    catalog,
    range,
    mode,
    buildStateOverrides(catalog, range, currentGroupDraft),
  );
}

export function AdminGroupRawEditModal({
  catalog,
  currentGroupDraft,
  initialGroupIndex,
  isSaving,
  error,
  onClose,
  onErrorChange,
  onSave,
}: AdminGroupRawEditModalProps) {
  const titleId = useId();
  const initialRange = useRef<AdminGroupRange>({
    from: initialGroupIndex,
    to: initialGroupIndex,
  });
  const [mode, setMode] = useState<AdminGroupRawEditMode>("txt");
  const [appliedRange, setAppliedRange] = useState<AdminGroupRange>(
    initialRange.current,
  );
  const [fromInput, setFromInput] = useState(String(initialGroupIndex));
  const [toInput, setToInput] = useState(String(initialGroupIndex));
  const [loadedText, setLoadedText] = useState(() =>
    serializeRangeText(catalog, initialRange.current, "txt", currentGroupDraft),
  );
  const [text, setText] = useState(loadedText);
  const [pendingRange, setPendingRange] = useState<AdminGroupRange | null>(null);
  const [didCopy, setDidCopy] = useState(false);
  const copyResetTimeoutRef = useRef<number | null>(null);

  const clearCopyResetTimeout = () => {
    if (copyResetTimeoutRef.current != null) {
      window.clearTimeout(copyResetTimeoutRef.current);
      copyResetTimeoutRef.current = null;
    }
  };

  const resetCopyState = () => {
    clearCopyResetTimeout();
    setDidCopy(false);
  };

  const scheduleCopyReset = () => {
    clearCopyResetTimeout();
    copyResetTimeoutRef.current = window.setTimeout(() => {
      setDidCopy(false);
      copyResetTimeoutRef.current = null;
    }, 2000);
  };

  const commitRange = useCallback(
    (nextRange: AdminGroupRange) => {
      const nextText = serializeRangeText(
        catalog,
        nextRange,
        mode,
        currentGroupDraft,
      );

      setAppliedRange(nextRange);
      setFromInput(String(nextRange.from));
      setToInput(String(nextRange.to));
      setLoadedText(nextText);
      setText(nextText);
      resetCopyState();
      onErrorChange(null);
    },
    [catalog, currentGroupDraft, mode, onErrorChange],
  );

  const applyRangeInputs = useCallback(() => {
    const nextRange = normalizeGroupRangeInputs(fromInput, toInput, catalog);

    if (!nextRange) {
      setFromInput(String(appliedRange.from));
      setToInput(String(appliedRange.to));
      return;
    }

    if (nextRange.from === appliedRange.from && nextRange.to === appliedRange.to) {
      setFromInput(String(nextRange.from));
      setToInput(String(nextRange.to));
      return;
    }

    if (text !== loadedText) {
      setPendingRange(nextRange);
      return;
    }

    commitRange(nextRange);
  }, [
    appliedRange.from,
    appliedRange.to,
    catalog,
    commitRange,
    fromInput,
    loadedText,
    text,
    toInput,
  ]);

  useEffect(() => () => clearCopyResetTimeout(), []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isSaving && pendingRange == null) {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isSaving, onClose, pendingRange]);

  const handleModeChange = (nextMode: AdminGroupRawEditMode) => {
    if (nextMode === mode || isSaving) {
      return;
    }

    const parsed = parseAdminGroupRawEditRange(text, catalog, appliedRange, mode);

    if (!parsed.ok) {
      onErrorChange(parsed.error);
      return;
    }

    const nextText = serializeAdminGroupRawEditRange(
      catalog,
      appliedRange,
      nextMode,
      new Map(parsed.items.map((item) => [item.state.groupId, item.state])),
    );

    setMode(nextMode);
    setText(nextText);
    setLoadedText(nextText);
    resetCopyState();
    onErrorChange(null);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setDidCopy(true);
      scheduleCopyReset();
    } catch {
      resetCopyState();
    }
  };

  const handleRangeInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      applyRangeInputs();
    }
  };

  const copyLabel = didCopy
    ? mode === "txt"
      ? "Copied TXT"
      : "Copied JSON"
    : mode === "txt"
      ? "Copy TXT"
      : "Copy JSON";

  return (
    <>
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
              resetCopyState();
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

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <button
                className={secondaryTextButtonClassName()}
                disabled={isSaving}
                onClick={handleCopy}
                type="button"
              >
                {copyLabel}
              </button>
              <div className="flex items-center gap-2 text-sm text-foreground">
                <span>From</span>
                <input
                  aria-label="From group"
                  className="w-16 rounded-md border border-border bg-background px-2 py-1 text-center font-mono text-sm"
                  disabled={isSaving}
                  inputMode="numeric"
                  onChange={(event) => setFromInput(event.target.value)}
                  onKeyDown={handleRangeInputKeyDown}
                  value={fromInput}
                />
                <span>to</span>
                <input
                  aria-label="To group"
                  className="w-16 rounded-md border border-border bg-background px-2 py-1 text-center font-mono text-sm"
                  disabled={isSaving}
                  inputMode="numeric"
                  onChange={(event) => setToInput(event.target.value)}
                  onKeyDown={handleRangeInputKeyDown}
                  value={toInput}
                />
              </div>
            </div>
            <div className="flex gap-2">
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
                onClick={() => onSave(text, mode, appliedRange)}
                type="button"
              >
                {isSaving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {pendingRange != null ? (
        <AdminConfirmDialog
          confirmLabel="Discard and reload"
          description="The textarea has unsaved edits. Discard them and load the selected group range?"
          onClose={() => setPendingRange(null)}
          onConfirm={() => {
            commitRange(pendingRange);
            setPendingRange(null);
          }}
          title="Discard textarea changes?"
        />
      ) : null}
    </>
  );
}
