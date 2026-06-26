import { describe, expect, it } from "vitest";
import type { ToeicQuestion, ToeicQuestionGroup } from "@/entities/toeic/api/types";
import {
  buildAggregatePracticeRunSteps,
  buildPracticeRunSteps,
} from "./practiceRunSteps";

function makeQuestion(
  id: number,
  questionNumber: number,
  sessionQuestionNumber: number,
): ToeicQuestion {
  return {
    id,
    questionNumber,
    sessionQuestionNumber,
    question: null,
    questionVi: null,
    options: {
      A: null,
      B: null,
      C: null,
      D: null,
      A_vi: null,
      B_vi: null,
      C_vi: null,
      D_vi: null,
    },
    optionCount: 4,
    answerKey: null,
    selectedKey: null,
    status: null,
    isCorrect: null,
  };
}

function makeGroup(id: number, questions: ToeicQuestion[]): ToeicQuestionGroup {
  return {
    id,
    partNumber: 4,
    questionStart: questions[0]?.questionNumber ?? 0,
    questionEnd: questions[questions.length - 1]?.questionNumber ?? 0,
    groupStatus: null,
    groupType: null,
    accent: null,
    content: null,
    contentVi: null,
    audioUrl: null,
    audioUrlExpiresAt: null,
    imageUrl: null,
    imageUrlExpiresAt: null,
    questions,
  };
}

describe("buildAggregatePracticeRunSteps", () => {
  it("keeps backend group order when questionNumber duplicates across tests", () => {
    const groups = [
      makeGroup(1, [
        makeQuestion(101, 71, 1),
        makeQuestion(102, 72, 2),
      ]),
      makeGroup(2, [
        makeQuestion(201, 71, 3),
        makeQuestion(202, 72, 4),
      ]),
    ];

    const steps = buildAggregatePracticeRunSteps(4, groups);

    expect(steps).toHaveLength(2);
    expect(steps[0]?.kind).toBe("group");
    expect(steps[1]?.kind).toBe("group");

    if (steps[0]?.kind === "group" && steps[1]?.kind === "group") {
      expect(steps[0].practiceGroup.questions.map((question) => question.id)).toEqual([
        101, 102,
      ]);
      expect(steps[1].practiceGroup.questions.map((question) => question.id)).toEqual([
        201, 202,
      ]);
    }
  });

  it("does not interleave groups unlike questionNumber-sorted test practice", () => {
    const groups = [
      makeGroup(1, [
        makeQuestion(101, 71, 1),
        makeQuestion(102, 72, 2),
      ]),
      makeGroup(2, [
        makeQuestion(201, 71, 3),
        makeQuestion(202, 72, 4),
      ]),
    ];

    const sortedSteps = buildPracticeRunSteps({ 4: groups }, [4]);

    expect(sortedSteps).toHaveLength(4);
    expect(
      sortedSteps.filter(
        (step) =>
          step.kind === "group" && step.practiceGroup.questions.length === 2,
      ),
    ).toHaveLength(0);
  });
});
