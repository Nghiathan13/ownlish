import { apiRequest, invalidApiResponse } from "@/shared/api/http";
import { isNullableString, isNumber, isRecord, isString } from "@/shared/lib/parse";
import type { DictationProgress } from "../model/types";

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => isString(item));
}

function parseProgress(value: unknown): DictationProgress | null {
  if (value === null) return null;
  if (!isRecord(value)) invalidApiResponse();

  const {
    videoId,
    currentSegmentId,
    answeredSegmentIds,
    correctCount,
    completedAt,
    updatedAt,
  } = value;
  if (
    !isString(videoId) ||
    !isNullableString(currentSegmentId) ||
    !isStringArray(answeredSegmentIds) ||
    !isNumber(correctCount) ||
    !isNullableString(completedAt) ||
    !isString(updatedAt)
  ) {
    invalidApiResponse();
  }

  return {
    videoId,
    currentSegmentId,
    answeredSegmentIds,
    correctCount,
    completedAt,
    updatedAt,
  };
}

export function getDictationProgress(token: string, videoId: string) {
  return apiRequest(`/dictation/videos/${videoId}/progress`, { token }).then(parseProgress);
}

export function submitDictationAnswer(
  token: string,
  input: {
    nextSegmentId: string | null;
    segmentId: string;
    videoId: string;
  },
) {
  return apiRequest(`/dictation/videos/${input.videoId}/answers`, {
    method: "POST",
    token,
    body: JSON.stringify({
      segmentId: input.segmentId,
      nextSegmentId: input.nextSegmentId,
    }),
  }).then((body) => parseProgress(body) ?? invalidApiResponse());
}

export function resetDictationProgress(token: string, videoId: string) {
  return apiRequest(`/dictation/videos/${videoId}/progress`, {
    method: "DELETE",
    token,
  });
}
