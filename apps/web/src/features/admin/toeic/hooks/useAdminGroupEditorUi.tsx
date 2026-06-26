"use client";

import { AdminGroupEditButton } from "@/features/admin/toeic/components/AdminGroupEditButton";
import { AdminGroupRawEditorModal } from "@/features/admin/toeic/components/AdminGroupRawEditorModal";
import { useAdminGroupRawEditor } from "@/features/admin/toeic/hooks/useAdminGroupRawEditor";
import { shouldShowAdminGroupEdit } from "@/features/admin/toeic/lib/adminGroupEditorState";
import { isAdminUser } from "@/features/auth/lib/isAdminUser";
import { useAuthSession } from "@/features/auth/hooks/useAuthSession";

type UseAdminGroupEditorUiParams = {
  groupId: number | null;
  onSaved: () => void | Promise<void>;
};

export function useAdminGroupEditorUi({
  groupId,
  onSaved,
}: UseAdminGroupEditorUiParams) {
  const { user } = useAuthSession();
  const isAdmin = isAdminUser(user);
  const editor = useAdminGroupRawEditor({ groupId, onSaved });

  if (!shouldShowAdminGroupEdit(isAdmin)) {
    return {
      leftSlot: null,
      modal: null,
      navigationDisabled: false,
    };
  }

  return {
    leftSlot: (
      <AdminGroupEditButton
        disabled={groupId == null || editor.isOpen}
        onClick={() => {
          void editor.open();
        }}
      />
    ),
    modal: (
      <AdminGroupRawEditorModal
        baseline={editor.baseline}
        draft={editor.draft}
        error={editor.error}
        isDirty={editor.isDirty}
        isLoading={editor.isLoading}
        isOpen={editor.isOpen}
        isSaving={editor.isSaving}
        onCancel={editor.cancel}
        onChange={editor.setDraft}
        onSave={() => {
          void editor.save();
        }}
      />
    ),
    navigationDisabled: editor.isOpen,
  };
}
