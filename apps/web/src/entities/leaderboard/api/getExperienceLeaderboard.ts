import { apiRequest, invalidApiResponse } from "@/shared/api";
import { isNullableString, isNumber, isRecord, isString } from "@/shared/lib/parse";
import type { ExperienceLeaderboard, ExperienceLeaderboardEntry } from "../model/types";

function parseEntry(value: unknown): ExperienceLeaderboardEntry {
  if (!isRecord(value)) invalidApiResponse();

  const { avatarUrl, displayName, experience, rank } = value;
  if (
    !isNullableString(avatarUrl) ||
    !isString(displayName) ||
    !isNumber(experience) ||
    !isNumber(rank)
  ) {
    invalidApiResponse();
  }

  return { avatarUrl, displayName, experience, rank };
}

export function parseExperienceLeaderboard(value: unknown): ExperienceLeaderboard {
  if (!isRecord(value) || !Array.isArray(value.entries)) invalidApiResponse();

  return { entries: value.entries.map(parseEntry) };
}

export function getExperienceLeaderboard(token: string, signal?: AbortSignal) {
  return apiRequest("/leaderboard/experience", { signal, token }).then(
    parseExperienceLeaderboard,
  );
}
