import type { UserVocabularyEntry } from "@/entities/vocab/api/vocab";

export function randomizeReviewQueue(
  items: UserVocabularyEntry[],
  ranks: Map<string, number>,
  random = Math.random,
): UserVocabularyEntry[] {
  for (const item of items) {
    if (!ranks.has(item.id)) {
      ranks.set(item.id, random());
    }
  }

  return [...items].sort(
    (left, right) => ranks.get(left.id)! - ranks.get(right.id)!,
  );
}
