import type { AdminToeicGroupImageDeleteResponse } from "@/features/admin/toeic/api/types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function parseAdminToeicGroupImageDeleteResponse(
  body: unknown,
): AdminToeicGroupImageDeleteResponse {
  if (!isRecord(body) || !isRecord(body.group)) {
    throw new Error("Invalid admin TOEIC group image delete response");
  }

  const group = body.group;

  if (typeof group.id !== "number") {
    throw new Error("Invalid admin TOEIC group image delete response");
  }

  if (group.imageUrl !== null || group.imageUrlExpiresAt !== null) {
    throw new Error("Invalid admin TOEIC group image delete response");
  }

  return {
    group: {
      id: group.id,
      imageUrl: null,
      imageUrlExpiresAt: null,
    },
  };
}
