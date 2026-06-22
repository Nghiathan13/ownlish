export function getVocabStatsQueryKey(
  userId: string | null,
  collectionId: string | null = null,
) {
  return ["vocab-stats", { userId, collectionId }] as const;
}
