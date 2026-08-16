export type ExperienceLeaderboardRecord = {
  rank: number;
  name: string | null;
  avatarUrl: string | null;
  avatarStoragePath: string | null;
  experience: number;
};

export type ExperienceLeaderboardResponse = {
  entries: Array<{
    rank: number;
    displayName: string;
    avatarUrl: string | null;
    experience: number;
  }>;
};
