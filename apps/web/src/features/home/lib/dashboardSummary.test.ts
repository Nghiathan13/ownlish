import { describe, expect, it } from "vitest";
import type { VocabStats } from "@/entities/vocab/api/vocab";
import {
  buildPartPracticeSummary,
  getDashboardNextAction,
} from "@/features/home/lib/dashboardSummary";

describe("dashboard learning summary", () => {
  it("aggregates Part Practice and highlights the highest current wrong rate", () => {
    const result = buildPartPracticeSummary([
      { partNumber: 1, total: 20, answered: 10, correct: 8, wrong: 2 },
      { partNumber: 2, total: 20, answered: 0, correct: 0, wrong: 0 },
      { partNumber: 3, total: 20, answered: 4, correct: 1, wrong: 3 },
    ]);

    expect(result).toMatchObject({
      accuracy: 64,
      answered: 14,
      correct: 9,
      total: 60,
      wrong: 5,
      suggestedPartNumber: 3,
    });
    expect(result.attentionPart?.partNumber).toBe(3);
  });

  it("suggests the first unfinished part when no mistakes need attention", () => {
    const result = buildPartPracticeSummary([
      { partNumber: 1, total: 2, answered: 2, correct: 2, wrong: 0 },
      { partNumber: 2, total: 4, answered: 0, correct: 0, wrong: 0 },
    ]);

    expect(result.accuracy).toBe(100);
    expect(result.attentionPart).toBeNull();
    expect(result.suggestedPartNumber).toBe(2);
  });

  it("prioritizes due vocabulary over Part Practice mistakes", () => {
    const stats: VocabStats = {
      total: 20,
      due: 3,
      mastered: 6,
      highWrongCount: 2,
      levels: [],
    };
    const partPractice = buildPartPracticeSummary([
      { partNumber: 3, total: 10, answered: 4, correct: 1, wrong: 3 },
    ]);

    expect(getDashboardNextAction({ partPractice, stats })).toMatchObject({
      href: "/review",
      label: "Start review",
      title: "Review 3 vocabulary items",
    });
  });
});
