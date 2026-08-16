import type {
  ExperienceLeaderboardEntry,
  StudyTimeLeaderboardEntry,
} from "@/entities/leaderboard";
import { formatExperience, formatStudyTime } from "./leaderboardFormat";

export type LeaderboardListEntry = {
  avatarUrl: string | null;
  displayName: string;
  rank: number;
  value: string;
};

export function toStudyTimeLeaderboardListEntries(
  entries: StudyTimeLeaderboardEntry[],
  locale: "en" | "vi",
): LeaderboardListEntry[] {
  return entries.map((entry) => ({
    avatarUrl: entry.avatarUrl,
    displayName: entry.displayName,
    rank: entry.rank,
    value: formatStudyTime(entry.studySeconds, locale),
  }));
}

export function toExperienceLeaderboardListEntries(
  entries: ExperienceLeaderboardEntry[],
  locale: "en" | "vi",
): LeaderboardListEntry[] {
  return entries.map((entry) => ({
    avatarUrl: entry.avatarUrl,
    displayName: entry.displayName,
    rank: entry.rank,
    value: formatExperience(entry.experience, locale),
  }));
}
