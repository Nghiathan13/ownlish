import { apiRequest } from "@/shared/api/http";
import { parseAdminToeicGroupRawPayload } from "@/features/admin/toeic/lib/parseAdminToeicGroupRaw";
import type {
  AdminToeicGroupRawPatchInput,
  AdminToeicGroupRawPayload,
} from "./types";

export function getAdminToeicGroupRaw(
  token: string,
  groupId: number,
): Promise<AdminToeicGroupRawPayload> {
  return apiRequest(`/admin/tests/groups/${groupId}/raw`, { token }).then(
    parseAdminToeicGroupRawPayload,
  );
}

export function patchAdminToeicGroupRaw(
  token: string,
  groupId: number,
  input: AdminToeicGroupRawPatchInput,
): Promise<AdminToeicGroupRawPayload> {
  return apiRequest(`/admin/tests/groups/${groupId}/raw`, {
    token,
    method: "PATCH",
    body: JSON.stringify(input),
    headers: {
      "Content-Type": "application/json",
    },
  }).then(parseAdminToeicGroupRawPayload);
}
