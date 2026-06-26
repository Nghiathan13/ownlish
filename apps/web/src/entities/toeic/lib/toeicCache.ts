import type { QueryClient } from "@tanstack/react-query";
import type { PracticeMode } from "@/entities/toeic/api/types";
import type { ToeicYear } from "@/features/tests/shared/constants/toeicYears";
import { normalizeSelectedParts } from "@/features/tests/shared/lib/toeicParts";

export function getToeicTestsQueryKey(userId: string | null, year: ToeicYear) {
  return ["tests", { userId, year }] as const;
}

export function getPracticeSessionQueryKey(
  sessionId: string,
  partNumberOrParts: number | number[],
  mode: PracticeMode = "practice",
) {
  const parts = Array.isArray(partNumberOrParts)
    ? normalizeSelectedParts(partNumberOrParts)
    : [partNumberOrParts];

  return ["practice-session", sessionId, parts.join(","), mode] as const;
}

export function getToeicRunQueryKey(sessionId: string) {
  return ["toeic-run", sessionId] as const;
}

export function invalidateToeicTestsOverview(
  queryClient: QueryClient,
  userId: string | null,
  year: ToeicYear,
) {
  return queryClient.invalidateQueries({
    queryKey: getToeicTestsQueryKey(userId, year),
  });
}

export function invalidateAllPracticeSessions(queryClient: QueryClient) {
  return queryClient.invalidateQueries({
    queryKey: ["practice-session"],
  });
}

export function invalidateToeicRunCaches(queryClient: QueryClient) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: ["tests"] }),
    invalidateAllPracticeSessions(queryClient),
    queryClient.invalidateQueries({ queryKey: ["toeic-run"] }),
  ]);
}

export function getPartPracticeOverviewQueryKey(userId: string | null) {
  return ["part-practice-overview", { userId }] as const;
}

export function getPartPracticeSessionQueryKey(
  sessionId: string,
  mode: PracticeMode = "practice",
) {
  return ["part-practice-session", sessionId, mode] as const;
}

export function invalidateAllPartPracticeSessions(queryClient: QueryClient) {
  return queryClient.invalidateQueries({
    queryKey: ["part-practice-session"],
  });
}

export function invalidatePartPracticeOverview(
  queryClient: QueryClient,
  userId: string | null,
) {
  return queryClient.invalidateQueries({
    queryKey: getPartPracticeOverviewQueryKey(userId),
  });
}
