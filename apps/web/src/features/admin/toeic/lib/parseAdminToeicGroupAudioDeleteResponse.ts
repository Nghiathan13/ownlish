import type { AdminToeicGroupAudioDeleteResponse } from "@/features/admin/toeic/api/types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function parseAdminToeicGroupAudioDeleteResponse(
  body: unknown,
): AdminToeicGroupAudioDeleteResponse {
  if (!isRecord(body) || !isRecord(body.group)) {
    throw new Error("Invalid admin TOEIC group audio delete response");
  }

  const group = body.group;

  if (typeof group.id !== "number") {
    throw new Error("Invalid admin TOEIC group audio delete response");
  }

  if (group.audioUrl !== null || group.audioUrlExpiresAt !== null) {
    throw new Error("Invalid admin TOEIC group audio delete response");
  }

  return {
    group: {
      id: group.id,
      audioUrl: null,
      audioUrlExpiresAt: null,
    },
  };
}
