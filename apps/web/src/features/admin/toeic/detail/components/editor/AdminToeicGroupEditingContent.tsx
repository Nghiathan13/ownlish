"use client";

import { useEffect, useState } from "react";
import type { AdminToeicTestRawGroup } from "@/features/admin/toeic/api/types";
import { AdminConfirmDialog } from "@/features/admin/toeic/detail/components/editor/AdminConfirmDialog";
import { AdminToeicGroupEditorFields } from "@/features/admin/toeic/detail/components/editor/AdminToeicGroupEditorFields";
import { AdminToeicMediaPreview } from "@/features/admin/toeic/detail/components/AdminToeicMediaPreview";
import { useAdminGroupEditor } from "@/features/admin/toeic/detail/hooks/useAdminGroupEditor";
import {
  primaryTextButtonClassName,
  secondaryTextButtonClassName,
} from "@/shared/ui/button";

type ConfirmKind = "discard" | "save";

type AdminToeicGroupEditingContentProps = {
  group: AdminToeicTestRawGroup;
  onDirtyChange: (isDirty: boolean) => void;
  onExitEdit: () => void;
  onSaved: (updatedGroup: AdminToeicTestRawGroup) => void;
};

export function AdminToeicGroupEditingContent({
  group,
  onDirtyChange,
  onExitEdit,
  onSaved,
}: AdminToeicGroupEditingContentProps) {
  const editor = useAdminGroupEditor({
    group,
    onSaved: (updatedGroup) => {
      onSaved(updatedGroup);
      onExitEdit();
    },
  });
  const [confirmKind, setConfirmKind] = useState<ConfirmKind | null>(null);

  useEffect(() => {
    onDirtyChange(editor.isDirty);
    return () => onDirtyChange(false);
  }, [editor.isDirty, onDirtyChange]);

  const handleCancel = () => {
    if (editor.isDirty) {
      setConfirmKind("discard");
      return;
    }

    onExitEdit();
  };

  const handleSaveClick = () => {
    if (!editor.isDirty || editor.isSaving) {
      return;
    }

    setConfirmKind("save");
  };

  const handleConfirm = async () => {
    if (confirmKind === "discard") {
      setConfirmKind(null);
      onExitEdit();
      return;
    }

    if (confirmKind === "save") {
      const didSave = await editor.save();
      if (didSave) {
        setConfirmKind(null);
      }
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <button
          className={secondaryTextButtonClassName()}
          disabled={editor.isSaving}
          onClick={handleCancel}
          type="button"
        >
          Cancel
        </button>
        <button
          className={primaryTextButtonClassName()}
          disabled={!editor.isDirty || editor.isSaving}
          onClick={handleSaveClick}
          type="button"
        >
          {editor.isSaving ? "Saving…" : "Save"}
        </button>
      </div>

      <AdminToeicMediaPreview
        audioUrl={group.audioUrl}
        imageUrl={group.imageUrl}
      />
      <AdminToeicGroupEditorFields
        draft={editor.draft}
        onChange={editor.setDraft}
      />
      {editor.error ? (
        <p className="text-sm text-muted-foreground">{editor.error}</p>
      ) : null}

      {confirmKind === "discard" ? (
        <AdminConfirmDialog
          confirmLabel="Discard"
          description="Unsaved changes in this group will be lost."
          onClose={() => setConfirmKind(null)}
          onConfirm={handleConfirm}
          title="Discard changes?"
        />
      ) : null}

      {confirmKind === "save" ? (
        <AdminConfirmDialog
          confirmLabel={editor.isSaving ? "Saving…" : "Save"}
          description="Save the updated group content and questions?"
          isConfirming={editor.isSaving}
          onClose={() => setConfirmKind(null)}
          onConfirm={handleConfirm}
          title="Save changes?"
        />
      ) : null}
    </div>
  );
}
