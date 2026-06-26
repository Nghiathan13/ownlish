"use client";

import { useCallback, useState } from "react";
import { runAuthenticatedRequest } from "@/entities/session/model/authenticatedRequest";
import {
  getAdminToeicGroupRaw,
  patchAdminToeicGroupRaw,
} from "@/features/admin/toeic/api/adminToeicGroup";
import type {
  AdminToeicGroupRaw,
  AdminToeicGroupRawPatchInput,
} from "@/features/admin/toeic/api/types";
import {
  cloneAdminToeicGroupDraft,
  isAdminToeicGroupDraftDirty,
  type AdminToeicGroupDraft,
} from "@/features/admin/toeic/lib/adminGroupEditorState";
import { ApiError } from "@/shared/api/http";

type UseAdminGroupRawEditorParams = {
  groupId: number | null;
  onSaved: () => void | Promise<void>;
};

function toPatchInput(draft: AdminToeicGroupDraft): AdminToeicGroupRawPatchInput {
  return {
    group: {
      groupType: draft.groupType,
      accent: draft.accent,
      content: draft.content,
      contentVi: draft.contentVi,
    },
    questions: draft.questions.map((question) => ({
      id: question.id,
      question: question.question,
      questionVi: question.questionVi,
      questionType: question.questionType,
      optionA: question.optionA,
      optionB: question.optionB,
      optionC: question.optionC,
      optionD: question.optionD,
      optionAVi: question.optionAVi,
      optionBVi: question.optionBVi,
      optionCVi: question.optionCVi,
      optionDVi: question.optionDVi,
      answerKey: question.answerKey,
      explanationVi: question.explanationVi,
    })),
  };
}

export function useAdminGroupRawEditor({
  groupId,
  onSaved,
}: UseAdminGroupRawEditorParams) {
  const [isOpen, setIsOpen] = useState(false);
  const [baseline, setBaseline] = useState<AdminToeicGroupRaw | null>(null);
  const [draft, setDraft] = useState<AdminToeicGroupDraft | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setIsOpen(false);
    setBaseline(null);
    setDraft(null);
    setIsLoading(false);
    setIsSaving(false);
    setError(null);
  }, []);

  const open = useCallback(async () => {
    if (groupId == null) {
      return;
    }

    setIsOpen(true);
    setIsLoading(true);
    setError(null);

    try {
      const payload = await runAuthenticatedRequest({
        request: (token) => getAdminToeicGroupRaw(token, groupId),
      });
      setBaseline(payload.group);
      setDraft(cloneAdminToeicGroupDraft(payload.group));
    } catch (loadError) {
      setError(
        loadError instanceof ApiError
          ? loadError.message
          : "Failed to load group data.",
      );
      setBaseline(null);
      setDraft(null);
    } finally {
      setIsLoading(false);
    }
  }, [groupId]);

  const cancel = useCallback(() => {
    if (
      baseline &&
      draft &&
      isAdminToeicGroupDraftDirty(baseline, draft) &&
      !window.confirm("Discard unsaved changes?")
    ) {
      return;
    }

    reset();
  }, [baseline, draft, reset]);

  const save = useCallback(async () => {
    if (groupId == null || !draft) {
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const payload = await runAuthenticatedRequest({
        request: (token) =>
          patchAdminToeicGroupRaw(token, groupId, toPatchInput(draft)),
      });
      setBaseline(payload.group);
      setDraft(cloneAdminToeicGroupDraft(payload.group));
      await onSaved();
      reset();
    } catch (saveError) {
      setError(
        saveError instanceof ApiError
          ? saveError.message
          : "Failed to save group data.",
      );
    } finally {
      setIsSaving(false);
    }
  }, [draft, groupId, onSaved, reset]);

  const isDirty =
    baseline != null && draft != null
      ? isAdminToeicGroupDraftDirty(baseline, draft)
      : false;

  return {
    isOpen,
    baseline,
    draft,
    setDraft,
    isLoading,
    isSaving,
    error,
    isDirty,
    open,
    cancel,
    save,
  };
}
