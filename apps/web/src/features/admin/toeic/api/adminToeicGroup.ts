import { apiRequest } from "@/shared/api/http";
import { parseAdminToeicGroupPatchResponse } from "@/features/admin/toeic/lib/parseAdminToeicPatchResponse";
import type {
  AdminToeicGroupPatchInput,
  AdminToeicGroupPatchResponse,
} from "./types";

export function patchAdminToeicGroup(
  token: string,
  groupId: number,
  input: AdminToeicGroupPatchInput,
): Promise<AdminToeicGroupPatchResponse> {
  return apiRequest(`/admin/tests/groups/${groupId}`, {
    token,
    method: "PATCH",
    body: JSON.stringify(input),
    headers: {
      "Content-Type": "application/json",
    },
  }).then(parseAdminToeicGroupPatchResponse);
}
