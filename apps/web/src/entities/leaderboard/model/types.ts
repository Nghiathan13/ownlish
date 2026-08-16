export type StudyTimeLeaderboardPeriod = "all" | "week" | "month";

export type StudyTimeLeaderboardEntry = {
  rank: number;
  displayName: string;
  avatarUrl: string | null;
  studySeconds: number;
};

export type StudyTimeLeaderboard = {
  period: StudyTimeLeaderboardPeriod;
  startsOn: string | null;
  endsOn: string | null;
  entries: StudyTimeLeaderboardEntry[];
};

export type ExperienceLeaderboardEntry = {
  rank: number;
  displayName: string;
  avatarUrl: string | null;
  experience: number;
};

export type ExperienceLeaderboard = {
  entries: ExperienceLeaderboardEntry[];
};
