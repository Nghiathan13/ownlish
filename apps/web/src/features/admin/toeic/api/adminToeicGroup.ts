import { apiRequest } from "@/shared/api/http";
import { parseAdminToeicGroupRawPayload } from "@/features/admin/toeic/lib/parseAdminToeicGroupRaw";
import type {
  AdminToeicGroupRawPatchInput,
  AdminToeicGroupRawPayload,
} from "./types";

export function getAdminToeicGroupRaw(
  groupId: number,
): Promise<AdminToeicGroupRawPayload> {
  return apiRequest(`/admin/tests/groups/${groupId}/raw`).then(
    parseAdminToeicGroupRawPayload,
  );
}

export function patchAdminToeicGroupRaw(
  groupId: number,
  input: AdminToeicGroupRawPatchInput,
): Promise<AdminToeicGroupRawPayload> {
  return apiRequest(`/admin/tests/groups/${groupId}/raw`, {
    method: "PATCH",
    body: JSON.stringify(input),
    headers: {
      "Content-Type": "application/json",
    },
  }).then(parseAdminToeicGroupRawPayload);
}
