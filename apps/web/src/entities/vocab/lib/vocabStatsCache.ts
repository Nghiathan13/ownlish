export function getVocabStatsQueryKey(userId: string | null) {
  return ["vocab-stats", { userId }] as const;
}
