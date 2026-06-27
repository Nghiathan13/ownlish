import type { AdminToeicGroupAudioUploadResponse } from "@/features/admin/toeic/api/types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function parseAdminToeicGroupAudioUploadResponse(
  body: unknown,
): AdminToeicGroupAudioUploadResponse {
  if (!isRecord(body) || !isRecord(body.group)) {
    throw new Error("Invalid admin TOEIC group audio upload response");
  }

  const group = body.group;

  if (typeof group.id !== "number") {
    throw new Error("Invalid admin TOEIC group audio upload response");
  }

  if (typeof group.audioUrl !== "string" || group.audioUrl.length === 0) {
    throw new Error("Invalid admin TOEIC group audio upload response");
  }

  if (
    typeof group.audioUrlExpiresAt !== "string" ||
    group.audioUrlExpiresAt.length === 0
  ) {
    throw new Error("Invalid admin TOEIC group audio upload response");
  }

  return {
    group: {
      id: group.id,
      audioUrl: group.audioUrl,
      audioUrlExpiresAt: group.audioUrlExpiresAt,
    },
  };
}
