import type { AdminToeicGroupImageUploadResponse } from "@/features/admin/toeic/api/types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function parseAdminToeicGroupImageUploadResponse(
  body: unknown,
): AdminToeicGroupImageUploadResponse {
  if (!isRecord(body) || !isRecord(body.group)) {
    throw new Error("Invalid admin TOEIC group image upload response");
  }

  const group = body.group;

  if (typeof group.id !== "number") {
    throw new Error("Invalid admin TOEIC group image upload response");
  }

  if (typeof group.imageUrl !== "string" || group.imageUrl.length === 0) {
    throw new Error("Invalid admin TOEIC group image upload response");
  }

  if (
    typeof group.imageUrlExpiresAt !== "string" ||
    group.imageUrlExpiresAt.length === 0
  ) {
    throw new Error("Invalid admin TOEIC group image upload response");
  }

  return {
    group: {
      id: group.id,
      imageUrl: group.imageUrl,
      imageUrlExpiresAt: group.imageUrlExpiresAt,
    },
  };
}
