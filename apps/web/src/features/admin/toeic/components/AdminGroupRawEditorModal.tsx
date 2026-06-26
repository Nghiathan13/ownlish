"use client";

import { AdminGroupRawForm } from "@/features/admin/toeic/components/AdminGroupRawForm";
import type { AdminToeicGroupRaw } from "@/features/admin/toeic/api/types";
import type { AdminToeicGroupDraft } from "@/features/admin/toeic/lib/adminGroupEditorState";
import {
  primaryTextButtonClassName,
  secondaryTextButtonClassName,
} from "@/shared/ui/button";
import { Modal } from "@/shared/ui/Modal";

type AdminGroupRawEditorModalProps = {
  baseline: AdminToeicGroupRaw | null;
  draft: AdminToeicGroupDraft | null;
  error: string | null;
  isDirty: boolean;
  isLoading: boolean;
  isOpen: boolean;
  isSaving: boolean;
  onCancel: () => void;
  onChange: (draft: AdminToeicGroupDraft) => void;
  onSave: () => void;
};

function getHeaderText(group: AdminToeicGroupRaw | null) {
  if (!group) {
    return null;
  }

  return `Test ${group.testId} · Part ${group.partNumber} · Q${group.questionStart}-${group.questionEnd}`;
}

export function AdminGroupRawEditorModal({
  baseline,
  draft,
  error,
  isDirty,
  isLoading,
  isOpen,
  isSaving,
  onCancel,
  onChange,
  onSave,
}: AdminGroupRawEditorModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <Modal
      description={getHeaderText(baseline) ?? undefined}
      onClose={onCancel}
      title="Edit TOEIC Group"
    >
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading group data...</p>
      ) : error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : draft ? (
        <AdminGroupRawForm draft={draft} onChange={onChange} />
      ) : (
        <p className="text-sm text-muted-foreground">
          Group data is unavailable.
        </p>
      )}

      <div className="flex justify-end gap-2">
        <button
          className={secondaryTextButtonClassName()}
          disabled={isSaving}
          onClick={onCancel}
          type="button"
        >
          Cancel
        </button>
        <button
          className={primaryTextButtonClassName()}
          disabled={!draft || !isDirty || isSaving || isLoading}
          onClick={() => {
            void onSave();
          }}
          type="button"
        >
          {isSaving ? "Saving..." : "Save"}
        </button>
      </div>
    </Modal>
  );
}
