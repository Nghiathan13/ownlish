import { apiRequest, invalidApiResponse } from "@/shared/api/http";
import {
  isNullableString,
  isNumber,
  isRecord,
} from "@/shared/lib/parse";
import type { RefreshMediaGroup } from "@/features/tests/shared/api/types";

function parseRefreshGroup(value: unknown): RefreshMediaGroup | null {
  if (!isRecord(value) || !isNumber(value.id)) {
    return null;
  }

  return {
    id: value.id,
    audioUrl: isNullableString(value.audioUrl) ? value.audioUrl : null,
    audioUrlExpiresAt: isNullableString(value.audioUrlExpiresAt)
      ? value.audioUrlExpiresAt
      : null,
    imageUrl: isNullableString(value.imageUrl) ? value.imageUrl : null,
    imageUrlExpiresAt: isNullableString(value.imageUrlExpiresAt)
      ? value.imageUrlExpiresAt
      : null,
  };
}

export async function refreshToeicPartMedia(
  token: string,
  testId: number,
  partNumber: number,
  groupIds?: number[],
) {
  const body = await apiRequest(
    `/tests/${testId}/parts/${partNumber}/refresh-media`,
    {
      method: "POST",
      token,
      body: JSON.stringify(groupIds?.length ? { groupIds } : {}),
    },
  );

  if (!isRecord(body) || !Array.isArray(body.groups)) {
    invalidApiResponse();
  }

  return body.groups
    .map(parseRefreshGroup)
    .filter((group): group is RefreshMediaGroup => group !== null);
}
