import { apiRequest, invalidApiResponse } from "@/shared/api";
import { isNumber, isRecord } from "@/shared/lib/parse";
import type { ExperienceSummary } from "../model/types";

export function parseExperienceSummary(value: unknown): ExperienceSummary {
  if (!isRecord(value) || !isNumber(value.totalXp)) invalidApiResponse();

  return { totalXp: value.totalXp };
}

export function getExperienceSummary(token: string, signal?: AbortSignal) {
  return apiRequest("/experience/summary", { signal, token }).then(parseExperienceSummary);
}
