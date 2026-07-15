import type { PartPracticePartSummary } from "@/entities/toeic/api/types";
import type { VocabStats } from "@/entities/vocab/api/vocab";

export type DashboardPartPracticeSummary = {
  accuracy: number | null;
  answered: number;
  attentionPart: PartPracticePartSummary | null;
  correct: number;
  suggestedPartNumber: number | null;
  total: number;
  wrong: number;
};

export type DashboardNextAction = {
  href: string;
  label: string;
  title: string;
};

function getAccuracy(correct: number, answered: number) {
  return answered > 0 ? Math.round((correct / answered) * 100) : null;
}

export function buildPartPracticeSummary(
  summaries: PartPracticePartSummary[],
): DashboardPartPracticeSummary {
  const totals = summaries.reduce(
    (result, summary) => ({
      total: result.total + summary.total,
      answered: result.answered + summary.answered,
      correct: result.correct + summary.correct,
      wrong: result.wrong + summary.wrong,
    }),
    { total: 0, answered: 0, correct: 0, wrong: 0 },
  );

  const attentionPart = summaries
    .filter((summary) => summary.answered > 0 && summary.wrong > 0)
    .sort((left, right) => {
      const wrongRateDifference =
        right.wrong / right.answered - left.wrong / left.answered;

      if (wrongRateDifference !== 0) {
        return wrongRateDifference;
      }

      if (left.wrong !== right.wrong) {
        return right.wrong - left.wrong;
      }

      return left.partNumber - right.partNumber;
    })[0] ?? null;

  const suggestedPartNumber =
    attentionPart?.partNumber ??
    summaries.find((summary) => summary.answered < summary.total)?.partNumber ??
    summaries[0]?.partNumber ??
    null;

  return {
    ...totals,
    accuracy: getAccuracy(totals.correct, totals.answered),
    attentionPart,
    suggestedPartNumber,
  };
}

export function getMasteryPercentage(stats: VocabStats | null) {
  if (!stats || stats.total === 0) {
    return 0;
  }

  return Math.round((stats.mastered / stats.total) * 100);
}

export function getDashboardNextAction({
  partPractice,
  stats,
}: {
  partPractice: DashboardPartPracticeSummary;
  stats: VocabStats | null;
}): DashboardNextAction {
  if (stats && stats.due > 0) {
    return {
      title: `Review ${stats.due} vocabulary ${stats.due === 1 ? "item" : "items"}`,
      href: "/review",
      label: "Start review",
    };
  }

  if (partPractice.wrong > 0) {
    return {
      title: `Revisit ${partPractice.wrong} Part Practice ${partPractice.wrong === 1 ? "mistake" : "mistakes"}`,
      href: "/tests",
      label: "Open Part Practice",
    };
  }

  if (stats && stats.total === 0) {
    return {
      title: "Build your first vocabulary list",
      href: "/collections?tab=user",
      label: "Browse collections",
    };
  }

  if (partPractice.answered > 0) {
    return {
      title: "Keep your Part Practice momentum",
      href: "/tests",
      label: "Continue practice",
    };
  }

  return {
    title: "Start a short Part Practice session",
    href: "/tests",
    label: "Explore Part Practice",
  };
}
