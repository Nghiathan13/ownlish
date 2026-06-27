"use client";

import { useCallback, useMemo, useState } from "react";
import { runAuthenticatedRequest } from "@/entities/session/model/authenticatedRequest";
import { patchAdminToeicGroup } from "@/features/admin/toeic/api/adminToeicGroup";
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
import { applyAdminEditsToCache } from "@/features/admin/toeic/detail/lib/applyAdminEditsToCache";
import { ApiError } from "@/shared/api/http";

type UseAdminGroupEditorParams = {
  group: AdminToeicTestRawGroup;
  onSaved: (updatedGroup: AdminToeicTestRawGroup) => void;
};

type SaveTask = {
  errorLabel: string;
  run: () => Promise<
    AdminToeicGroupPatchResponse | AdminToeicQuestionPatchResponse
  >;
  onSuccess: (
    response: AdminToeicGroupPatchResponse | AdminToeicQuestionPatchResponse,
  ) => void;
};

function getSaveErrorMessage(error: unknown) {
  return error instanceof ApiError ? error.message : null;
}

export function useAdminGroupEditor({
  group,
  onSaved,
}: UseAdminGroupEditorParams) {
  const baselineState = useMemo(
    () => createEditorStateFromGroup(group),
    [group],
  );
  const [state, setState] = useState<AdminGroupEditorState>(() =>
    cloneEditorState(baselineState),
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isDirty = isEditorDirty(state);

  const setDraft = useCallback((nextState: AdminGroupEditorState) => {
    setState(cloneEditorState(nextState));
  }, []);

  const resetDraft = useCallback(() => {
    setState(cloneEditorState(baselineState));
    setError(null);
  }, [baselineState]);

  const save = useCallback(async () => {
    setIsSaving(true);
    setError(null);

    const groupPlan = buildGroupPatch(state);
    const questionPlans = buildQuestionPatches(state);

    if (!groupPlan && questionPlans.length === 0) {
      setIsSaving(false);
      return false;
    }

    let nextState = cloneEditorState(state);
    let updatedGroup = group;
    const tasks: SaveTask[] = [];

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
      const errorMessages: string[] = [];
      let anySuccess = false;

      results.forEach((result, index) => {
        if (result.status === "fulfilled") {
          anySuccess = true;
          tasks[index]?.onSuccess(result.value);
          return;
        }

        const task = tasks[index];
        const detail = getSaveErrorMessage(result.reason);
        errorMessages.push(
          detail
            ? `Failed to save ${task?.errorLabel}: ${detail}`
            : `Failed to save ${task?.errorLabel}`,
        );
      });

      if (anySuccess) {
        setState(nextState);
        onSaved(updatedGroup);
      }

      if (errorMessages.length > 0) {
        setError(errorMessages.join("; "));
      }

      return errorMessages.length === 0;
    } catch (saveError) {
      setError(
        saveError instanceof ApiError
          ? saveError.message
          : "Failed to save group data.",
      );
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [group, onSaved, state]);

  return {
    draft: state,
    setDraft,
    isDirty,
    isSaving,
    error,
    resetDraft,
    save,
  };
}
