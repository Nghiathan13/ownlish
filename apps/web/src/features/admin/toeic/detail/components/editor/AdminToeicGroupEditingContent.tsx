"use client";

import { useEffect, useMemo, useState } from "react";
import type { AdminToeicTestRawGroup } from "@/features/admin/toeic/api/types";
import { AdminToeicSplitLayout } from "@/features/admin/toeic/detail/components/AdminToeicSplitLayout";
import { AdminConfirmDialog } from "@/features/admin/toeic/detail/components/editor/AdminConfirmDialog";
import {
  AdminToeicGroupFieldsSection,
  AdminToeicQuestionFieldsSection,
} from "@/features/admin/toeic/detail/components/editor/AdminToeicGroupEditorFields";
import { AdminToeicMediaPreview } from "@/features/admin/toeic/detail/components/AdminToeicMediaPreview";
import { useAdminGroupEditor } from "@/features/admin/toeic/detail/hooks/useAdminGroupEditor";
import type { AdminToeicRunStep } from "@/features/admin/toeic/detail/lib/adminToeicRunSteps";
import { getAdminStepQuestions } from "@/features/admin/toeic/detail/lib/adminToeicRunSteps";
import { resolveAdminGroupSaveConfirm } from "@/features/admin/toeic/detail/lib/adminToeicGroupSaveConfirm";
import {
  primaryTextButtonClassName,
  secondaryTextButtonClassName,
} from "@/shared/ui/button";

type ConfirmKind = "discard" | "save";

type AdminToeicGroupEditingContentProps = {
  group: AdminToeicTestRawGroup;
  onDirtyChange: (isDirty: boolean) => void;
  onExitEdit: () => void;
  onGroupPatched: (updatedGroup: AdminToeicTestRawGroup) => void;
  step: AdminToeicRunStep;
};

export function AdminToeicGroupEditingContent({
  group,
  onDirtyChange,
  onExitEdit,
  onGroupPatched,
  step,
}: AdminToeicGroupEditingContentProps) {
  const editor = useAdminGroupEditor({
    group,
    onGroupPatched,
  });
  const [confirmKind, setConfirmKind] = useState<ConfirmKind | null>(null);
  const visibleQuestionIds = useMemo(
    () => new Set(getAdminStepQuestions(step).map((question) => question.id)),
    [step],
  );
  const visibleQuestions = editor.draft.questions.filter((question) =>
    visibleQuestionIds.has(question.id),
  );

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
      await resolveAdminGroupSaveConfirm({
        closeConfirm: () => setConfirmKind(null),
        onExitEdit,
        save: editor.save,
      });
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
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

      <AdminToeicSplitLayout
        left={
          <>
            <AdminToeicMediaPreview
              audioUrl={group.audioUrl}
              imageUrl={group.imageUrl}
            />
            <AdminToeicGroupFieldsSection
              draft={editor.draft}
              onChange={editor.setDraft}
            />
          </>
        }
        right={
          <AdminToeicQuestionFieldsSection
            draft={editor.draft}
            onChange={editor.setDraft}
            questions={visibleQuestions}
          />
        }
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
