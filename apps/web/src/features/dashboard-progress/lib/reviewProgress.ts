import type { OxfordProgressSummary } from "@/entities/collection";
import type { VocabStats } from "@/entities/vocab";

export const EMPTY_PROGRESS: OxfordProgressSummary = {
  total: 0,
  masteredCount: 0,
  learningCount: 0,
  newCount: 0,
  levelCounts: Array.from({ length: 7 }, (_, index) => ({
    level: index + 1,
    count: 0,
  })),
};

export function mergeVocabStats(statsList: VocabStats[]): VocabStats {
  const levels = new Map<number, number>();
  let total = 0;
  let due = 0;
  let mastered = 0;
  let highWrongCount = 0;

  for (const stats of statsList) {
    total += stats.total;
    due += stats.due;
    mastered += stats.mastered;
    highWrongCount += stats.highWrongCount;
    for (const { count, level } of stats.levels) {
      levels.set(level, (levels.get(level) ?? 0) + count);
    }
  }

  return {
    total,
    due,
    mastered,
    highWrongCount,
    levels: Array.from(levels.entries())
      .map(([level, count]) => ({ level, count }))
      .sort((left, right) => left.level - right.level),
  };
}

export function mergeOxfordProgress(
  summaries: OxfordProgressSummary[],
): OxfordProgressSummary {
  const levelCounts = new Map<number, number>();
  let total = 0;
  let masteredCount = 0;
  let learningCount = 0;
  let newCount = 0;

  for (const summary of summaries) {
    total += summary.total;
    masteredCount += summary.masteredCount;
    learningCount += summary.learningCount;
    newCount += summary.newCount;
    for (const { count, level } of summary.levelCounts) {
      levelCounts.set(level, (levelCounts.get(level) ?? 0) + count);
    }
  }

  return {
    total,
    masteredCount,
    learningCount,
    newCount,
    levelCounts: Array.from({ length: 7 }, (_, index) => ({
      level: index + 1,
      count: levelCounts.get(index + 1) ?? 0,
    })),
  };
}

export function toCollectionProgress(
  stats: VocabStats | null,
): OxfordProgressSummary {
  const newCount = stats?.levels.find(({ level }) => level === 0)?.count ?? 0;
  const learningCount =
    stats?.levels
      .filter(({ level }) => level >= 1 && level <= 6)
      .reduce((total, { count }) => total + count, 0) ?? 0;
  const masteredCount = stats?.mastered ?? 0;
  const total = stats?.total ?? 0;
  const levelCounts = Array.from({ length: 7 }, (_, index) => ({
    level: index + 1,
    count: stats?.levels.find(({ level }) => level === index + 1)?.count ?? 0,
  }));

  return { total, masteredCount, learningCount, newCount, levelCounts };
}
