import { runAuthenticatedRequest } from "@/entities/session/model/authenticatedRequest";
import { patchAdminToeicGroup } from "@/features/admin/toeic/api/adminToeicGroup";
import { patchAdminToeicQuestion } from "@/features/admin/toeic/api/adminToeicQuestion";
import type {
  AdminToeicGroupPatchResponse,
  AdminToeicQuestionPatchResponse,
  AdminToeicTestRawGroup,
} from "@/features/admin/toeic/api/types";
import {
  buildGroupPatch,
  buildQuestionPatches,
  formatGroupSaveErrorLabel,
  formatQuestionSaveErrorLabel,
  type AdminGroupEditorState,
} from "@/features/admin/toeic/detail/lib/adminGroupEditorState";
import {
  processAdminGroupEditorSaveResults,
  type AdminGroupEditorSaveTask,
} from "@/features/admin/toeic/detail/lib/adminGroupEditorSave";
import { applyAdminEditsToCache } from "@/features/admin/toeic/detail/lib/applyAdminEditsToCache";
import { ApiError } from "@/shared/api/http";

export type AdminGroupEditorBulkSaveItem = {
  groupIndex: number;
  state: AdminGroupEditorState;
  group: AdminToeicTestRawGroup;
};

export type AdminGroupEditorBulkSaveResult = {
  didSave: boolean;
  error: string | null;
  savedGroups: AdminToeicTestRawGroup[];
};

function getSaveErrorMessage(error: unknown) {
  return error instanceof ApiError ? error.message : null;
}

export async function bulkSaveAdminGroupEditorStates(
  items: AdminGroupEditorBulkSaveItem[],
  onGroupPatched: (group: AdminToeicTestRawGroup) => void,
): Promise<AdminGroupEditorBulkSaveResult> {
  const tasks: AdminGroupEditorSaveTask[] = [];
  const updatedGroups = new Map<number, AdminToeicTestRawGroup>();

  for (const item of items) {
    let workingGroup = updatedGroups.get(item.group.id) ?? item.group;
    const groupPlan = buildGroupPatch(item.state);
    const questionPlans = buildQuestionPatches(item.state);

    if (groupPlan) {
      tasks.push({
        errorLabel: `group ${item.groupIndex} ${formatGroupSaveErrorLabel(groupPlan.changedFields)}`,
        run: () =>
          runAuthenticatedRequest({
            request: (token) =>
              patchAdminToeicGroup(token, item.group.id, groupPlan.patch),
          }),
        onSuccess: (response) => {
          const groupResponse = response as AdminToeicGroupPatchResponse;
          workingGroup = applyAdminEditsToCache(workingGroup, {
            group: groupResponse.group,
          });
          updatedGroups.set(item.group.id, workingGroup);
        },
      });
    }

    for (const questionPlan of questionPlans) {
      tasks.push({
        errorLabel: `group ${item.groupIndex} ${formatQuestionSaveErrorLabel(questionPlan.questionNumber)}`,
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
          workingGroup = applyAdminEditsToCache(workingGroup, {
            questions: [questionResponse.question],
          });
          updatedGroups.set(item.group.id, workingGroup);
        },
      });
    }
  }

  if (tasks.length === 0) {
    return { didSave: false, error: null, savedGroups: [] };
  }

  try {
    const results = await Promise.allSettled(tasks.map((task) => task.run()));
    const outcome = processAdminGroupEditorSaveResults(
      results,
      tasks,
      getSaveErrorMessage,
    );

    const savedGroups = [...updatedGroups.values()];

    if (outcome.anySuccess) {
      for (const group of savedGroups) {
        onGroupPatched(group);
      }
    }

    return {
      didSave: outcome.didSave,
      error: outcome.error,
      savedGroups: outcome.anySuccess ? savedGroups : [],
    };
  } catch (saveError) {
    return {
      didSave: false,
      error:
        saveError instanceof ApiError
          ? saveError.message
          : "Failed to save group data.",
      savedGroups: [],
    };
  }
}
