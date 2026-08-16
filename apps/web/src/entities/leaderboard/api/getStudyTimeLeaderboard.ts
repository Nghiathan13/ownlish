import { apiRequest, invalidApiResponse } from "@/shared/api";
import { isNullableString, isNumber, isRecord, isString } from "@/shared/lib/parse";
import type {
  StudyTimeLeaderboard,
  StudyTimeLeaderboardEntry,
  StudyTimeLeaderboardPeriod,
} from "../model/types";

type StudyTimeLeaderboardInput = {
  period: StudyTimeLeaderboardPeriod;
  anchor: string | null;
  signal?: AbortSignal;
};

function parsePeriod(value: unknown): StudyTimeLeaderboardPeriod {
  if (value === "all" || value === "week" || value === "month") {
    return value;
  }

  invalidApiResponse();
}

function parseEntry(value: unknown): StudyTimeLeaderboardEntry {
  if (!isRecord(value)) invalidApiResponse();

  const { avatarUrl, displayName, rank, studySeconds } = value;

  if (
    !isNullableString(avatarUrl) ||
    !isString(displayName) ||
    !isNumber(rank) ||
    !isNumber(studySeconds)
  ) {
    invalidApiResponse();
  }

  return { avatarUrl, displayName, rank, studySeconds };
}

export function parseStudyTimeLeaderboard(value: unknown): StudyTimeLeaderboard {
  if (!isRecord(value) || !Array.isArray(value.entries)) invalidApiResponse();

  const { endsOn, startsOn } = value;

  if (!isNullableString(endsOn) || !isNullableString(startsOn)) {
    invalidApiResponse();
  }

  return {
    period: parsePeriod(value.period),
    startsOn,
    endsOn,
    entries: value.entries.map(parseEntry),
  };
}

export function getStudyTimeLeaderboard(
  token: string,
  { anchor, period, signal }: StudyTimeLeaderboardInput,
) {
  const searchParams = new URLSearchParams({ period });

  if (anchor) {
    searchParams.set("anchor", anchor);
  }

  return apiRequest(`/leaderboard/study-time?${searchParams.toString()}`, {
    signal,
    token,
  }).then(parseStudyTimeLeaderboard);
}
