"use client";

import { useQuery } from "@tanstack/react-query";
import { getExperienceSummary } from "@/entities/experience";
import {
  isAuthenticatedStatus,
  runAuthenticatedRequest,
  useAuthSession,
} from "@/entities/session";
import { useLearningActivityCalendar } from "../model/useLearningActivityCalendar";
import { LearningActivityCalendarCard } from "./LearningActivityCalendarCard";

export function DashboardActivityPanel() {
  const { status, user } = useAuthSession();
  const isAuthenticated = isAuthenticatedStatus(status);
  const userId = user?.id ?? null;
  const learningActivity = useLearningActivityCalendar({
    isAuthenticated,
    userId,
  });
  const experienceSummary = useQuery({
    queryKey: ["experience", "summary", userId],
    queryFn: ({ signal }) =>
      runAuthenticatedRequest({
        request: (token) => getExperienceSummary(token, signal),
      }),
    enabled: isAuthenticated && Boolean(userId),
  });

  return (
    <LearningActivityCalendarCard
      calendar={learningActivity.calendar}
      experienceTotalXp={experienceSummary.data?.totalXp ?? 0}
      isExperienceLoading={experienceSummary.isLoading}
      isLoading={learningActivity.isLoading}
    />
  );
}
