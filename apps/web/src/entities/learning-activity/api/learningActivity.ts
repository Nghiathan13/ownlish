import { API_BASE_URL } from "@/shared/config/env";
import { apiRequest, invalidApiResponse } from "@/shared/api/http";
import { isNumber, isRecord, isString } from "@/shared/lib/parse";
import type {
  LearningActivityCalendar,
  LearningActivityCheckpointKind,
  LearningActivityType,
} from "../model/types";

type LearningActivityCheckpointInput = {
  activityType: LearningActivityType;
  elapsedSeconds: number;
  kind: LearningActivityCheckpointKind;
};

function parseCheckpointResult(value: unknown) {
  if (!isRecord(value) || !isNumber(value.acceptedSeconds)) {
    invalidApiResponse();
  }

  return { acceptedSeconds: value.acceptedSeconds };
}

function parseLearningActivityCalendar(value: unknown): LearningActivityCalendar {
  if (
    !isRecord(value) ||
    !Array.isArray(value.days) ||
    !value.days.every(
      (day) =>
        isRecord(day) &&
        isString(day.activityType) &&
        isString(day.learnedOn) &&
        isNumber(day.seconds),
    )
  ) {
    invalidApiResponse();
  }

  return {
    days: value.days.map((day) => ({
      activityType: day.activityType as LearningActivityType,
      learnedOn: day.learnedOn as string,
      seconds: day.seconds as number,
    })),
  };
}

export function getLearningActivityCalendar(token: string, signal?: AbortSignal) {
  return apiRequest("/learning-activity/calendar", {
    signal,
    token,
  }).then(parseLearningActivityCalendar);
}

export function submitLearningActivityCheckpoint(
  token: string,
  input: LearningActivityCheckpointInput,
) {
  return apiRequest("/learning-activity/checkpoints", {
    method: "POST",
    token,
    body: JSON.stringify(input),
  }).then(parseCheckpointResult);
}

export function submitLearningActivityCheckpointKeepalive(
  token: string,
  input: LearningActivityCheckpointInput,
) {
  void fetch(`${API_BASE_URL}/learning-activity/checkpoints`, {
    method: "POST",
    keepalive: true,
    credentials: "include",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  }).catch(() => undefined);
}
