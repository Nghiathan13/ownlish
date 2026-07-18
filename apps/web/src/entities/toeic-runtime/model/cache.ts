import type { QueryClient } from "@tanstack/react-query";
import type { PracticeMode } from "@/entities/toeic/api/types";

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
