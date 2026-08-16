export const STUDY_TIME_LEADERBOARD_PERIODS = ['all', 'week', 'month'] as const;

export type StudyTimeLeaderboardPeriod =
  (typeof STUDY_TIME_LEADERBOARD_PERIODS)[number];

export type StudyTimeLeaderboardQuery = {
  period: StudyTimeLeaderboardPeriod;
  anchor?: string;
};

export type StudyTimeLeaderboardRange = {
  startsOn: Date;
  endsOn: Date;
};

export type StudyTimeLeaderboardRecord = {
  rank: number;
  userId: string;
  name: string | null;
  avatarUrl: string | null;
  avatarStoragePath: string | null;
  studySeconds: number;
};

export type StudyTimeLeaderboardResponse = {
  period: StudyTimeLeaderboardPeriod;
  startsOn: string | null;
  endsOn: string | null;
  entries: Array<{
    rank: number;
    displayName: string;
    avatarUrl: string | null;
    studySeconds: number;
  }>;
};
