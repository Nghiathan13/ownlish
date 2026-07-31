"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getLearningActivityCalendar,
} from "@/entities/learning-activity";
import { runAuthenticatedRequest } from "@/entities/session/model/authenticatedRequest";

export function useLearningActivityCalendar({
  isAuthenticated,
  userId,
}: {
  isAuthenticated: boolean;
  userId: string | null;
}) {
  const query = useQuery({
    queryKey: ["learning-activity", "calendar", userId],
    queryFn: ({ signal }) =>
      runAuthenticatedRequest({
        request: (token) => getLearningActivityCalendar(token, signal),
      }),
    enabled: isAuthenticated && Boolean(userId),
  });

  return {
    calendar: query.data ?? null,
    isLoading: query.isLoading,
  };
}
