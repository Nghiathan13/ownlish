"use client";

import { useCallback, useMemo, useState } from "react";
import { runAuthenticatedRequest } from "@/entities/session/model/authenticatedRequest";
import {
  deleteAdminToeicGroupImage,
  patchAdminToeicGroup,
} from "@/features/admin/toeic/api/adminToeicGroup";
import { patchAdminToeicQuestion } from "@/features/admin/toeic/api/adminToeicQuestion";
import type {
  AdminToeicGroupPatchResponse,
  AdminToeicQuestionPatchResponse,
  AdminToeicTestRawGroup,
} from "@/features/admin/toeic/api/types";
import {
  applySuccessfulGroupSave,
  applySuccessfulQuestionSave,
  buildGroupPatch,
  buildQuestionPatches,
  cloneEditorState,
  createEditorStateFromGroup,
  formatGroupSaveErrorLabel,
  formatQuestionSaveErrorLabel,
  isEditorDirty,
  type AdminGroupEditorState,
} from "@/features/admin/toeic/detail/lib/adminGroupEditorState";
import {
  processAdminGroupEditorSaveResults,
  type AdminGroupEditorSaveTask,
} from "@/features/admin/toeic/detail/lib/adminGroupEditorSave";
import { applyAdminEditsToCache } from "@/features/admin/toeic/detail/lib/applyAdminEditsToCache";
import { ApiError } from "@/shared/api/http";

type UseAdminGroupEditorParams = {
  group: AdminToeicTestRawGroup;
  onGroupPatched: (updatedGroup: AdminToeicTestRawGroup) => void;
};

type AdminGroupEditorSaveResult = {
  didSave: boolean;
  error: string | null;
};

function getSaveErrorMessage(error: unknown) {
  return error instanceof ApiError ? error.message : null;
}

export function useAdminGroupEditor({
  group,
  onGroupPatched,
}: UseAdminGroupEditorParams) {
  const baselineState = useMemo(
    () => createEditorStateFromGroup(group),
    [group],
  );
  const [state, setState] = useState<AdminGroupEditorState>(() =>
    cloneEditorState(baselineState),
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isDeletingImage, setIsDeletingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isDirty = isEditorDirty(state);

  const setDraft = useCallback((nextState: AdminGroupEditorState) => {
    setState(cloneEditorState(nextState));
  }, []);

  const resetDraft = useCallback(() => {
    setState(cloneEditorState(baselineState));
    setError(null);
  }, [baselineState]);

  const save = useCallback(async (
    stateOverride?: AdminGroupEditorState,
  ): Promise<AdminGroupEditorSaveResult> => {
    setIsSaving(true);
    setError(null);

    const stateToSave = stateOverride ?? state;
    const groupPlan = buildGroupPatch(stateToSave);
    const questionPlans = buildQuestionPatches(stateToSave);

    if (!groupPlan && questionPlans.length === 0) {
      setIsSaving(false);
      return { didSave: false, error: null };
    }

    let nextState = cloneEditorState(stateToSave);
    let updatedGroup = group;
    const tasks: AdminGroupEditorSaveTask[] = [];

    if (groupPlan) {
      tasks.push({
        errorLabel: formatGroupSaveErrorLabel(groupPlan.changedFields),
        run: () =>
          runAuthenticatedRequest({
            request: (token) =>
              patchAdminToeicGroup(token, group.id, groupPlan.patch),
          }),
        onSuccess: (response) => {
          const groupResponse = response as AdminToeicGroupPatchResponse;
          updatedGroup = applyAdminEditsToCache(updatedGroup, {
            group: groupResponse.group,
          });
          nextState = applySuccessfulGroupSave(nextState, groupResponse.group);
        },
      });
    }

    for (const questionPlan of questionPlans) {
      tasks.push({
        errorLabel: formatQuestionSaveErrorLabel(questionPlan.questionNumber),
        run: () =>
          runAuthenticatedRequest({
            request: (token) =>
              patchAdminToeicQuestion(
                token,
                questionPlan.questionId,
                questionPlan.patch,
              ),
          }),
        onSuccess: (response) => {
          const questionResponse = response as AdminToeicQuestionPatchResponse;
          updatedGroup = applyAdminEditsToCache(updatedGroup, {
            questions: [questionResponse.question],
          });
          nextState = applySuccessfulQuestionSave(
            nextState,
            questionResponse.question,
          );
        },
      });
    }

    try {
      const results = await Promise.allSettled(tasks.map((task) => task.run()));
      const outcome = processAdminGroupEditorSaveResults(
        results,
        tasks,
        getSaveErrorMessage,
      );

      if (outcome.anySuccess) {
        setState(nextState);
        onGroupPatched(updatedGroup);
      }

      if (outcome.error) {
        setError(outcome.error);
      }

      return {
        didSave: outcome.didSave,
        error: outcome.error,
      };
    } catch (saveError) {
      const message =
        saveError instanceof ApiError
          ? saveError.message
          : "Failed to save group data.";
      setError(message);
      return { didSave: false, error: message };
    } finally {
      setIsSaving(false);
    }
  }, [group, onGroupPatched, state]);

  const deleteImage = useCallback(async (): Promise<{ error: string | null }> => {
    if (!group.imageUrl) {
      return { error: null };
    }

    setIsDeletingImage(true);
    setError(null);

    try {
      await runAuthenticatedRequest({
        request: (token) => deleteAdminToeicGroupImage(token, group.id),
      });

      onGroupPatched({
        ...group,
        imageUrl: null,
        imageUrlExpiresAt: null,
      });

      return { error: null };
    } catch (deleteError) {
      const message =
        deleteError instanceof ApiError
          ? deleteError.message
          : "Failed to delete group image.";
      setError(message);
      return { error: message };
    } finally {
      setIsDeletingImage(false);
    }
  }, [group, onGroupPatched]);

  return {
    draft: state,
    setDraft,
    isDirty,
    isSaving,
    isDeletingImage,
    error,
    resetDraft,
    save,
    deleteImage,
  };
}
