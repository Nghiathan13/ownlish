import { apiRequest } from "@/shared/api/http";
import { parseAdminToeicGroupPatchResponse } from "@/features/admin/toeic/lib/parseAdminToeicPatchResponse";
import { parseAdminToeicGroupImageDeleteResponse } from "@/features/admin/toeic/lib/parseAdminToeicGroupImageDeleteResponse";
import type {
  AdminToeicGroupImageDeleteResponse,
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

export function deleteAdminToeicGroupImage(
  token: string,
  groupId: number,
): Promise<AdminToeicGroupImageDeleteResponse> {
  return apiRequest(`/admin/tests/groups/${groupId}/image`, {
    token,
    method: "DELETE",
  }).then(parseAdminToeicGroupImageDeleteResponse);
}
