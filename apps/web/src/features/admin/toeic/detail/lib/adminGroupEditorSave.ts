import type {
  AdminToeicGroupPatchResponse,
  AdminToeicQuestionPatchResponse,
} from "@/features/admin/toeic/api/types";

export type AdminGroupEditorSaveTask = {
  errorLabel: string;
  run: () => Promise<
    AdminToeicGroupPatchResponse | AdminToeicQuestionPatchResponse
  >;
  onSuccess: (
    response: AdminToeicGroupPatchResponse | AdminToeicQuestionPatchResponse,
  ) => void;
};

export type AdminGroupEditorSaveOutcome = {
  anySuccess: boolean;
  didSave: boolean;
  error: string | null;
};

export function processAdminGroupEditorSaveResults(
  results: PromiseSettledResult<
    AdminToeicGroupPatchResponse | AdminToeicQuestionPatchResponse
  >[],
  tasks: AdminGroupEditorSaveTask[],
  getErrorMessage: (error: unknown) => string | null,
): AdminGroupEditorSaveOutcome {
  const errorMessages: string[] = [];
  let anySuccess = false;

  results.forEach((result, index) => {
    if (result.status === "fulfilled") {
      anySuccess = true;
      tasks[index]?.onSuccess(result.value);
      return;
    }

    const task = tasks[index];
    const detail = getErrorMessage(result.reason);
    errorMessages.push(
      detail
        ? `Failed to save ${task?.errorLabel}: ${detail}`
        : `Failed to save ${task?.errorLabel}`,
    );
  });

  return {
    anySuccess,
    didSave: errorMessages.length === 0,
    error: errorMessages.length > 0 ? errorMessages.join("; ") : null,
  };
}
