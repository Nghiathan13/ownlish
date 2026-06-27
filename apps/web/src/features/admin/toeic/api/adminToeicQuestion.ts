import { apiRequest } from "@/shared/api/http";
import { parseAdminToeicQuestionPatchResponse } from "@/features/admin/toeic/lib/parseAdminToeicPatchResponse";
import type {
  AdminToeicQuestionPatchInput,
  AdminToeicQuestionPatchResponse,
} from "./types";

export function patchAdminToeicQuestion(
  token: string,
  questionId: number,
  input: AdminToeicQuestionPatchInput,
): Promise<AdminToeicQuestionPatchResponse> {
  return apiRequest(`/admin/tests/questions/${questionId}`, {
    token,
    method: "PATCH",
    body: JSON.stringify(input),
    headers: {
      "Content-Type": "application/json",
    },
  }).then(parseAdminToeicQuestionPatchResponse);
}
