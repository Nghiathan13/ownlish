import { describe, expect, it } from "vitest";
import type {
  AdminToeicTestRawGroup,
  AdminToeicTestRawQuestion,
} from "@/features/admin/toeic/api/types";
import {
  buildAdminToeicRunSteps,
  findAdminStepIndexForQuestionId,
} from "@/features/admin/toeic/detail/lib/adminToeicRunSteps";

function makeQuestion(
  id: number,
  questionNumber: number,
): AdminToeicTestRawQuestion {
  return {
    id,
    questionNumber,
    question: `Q${questionNumber}`,
    questionVi: null,
    questionType: null,
    optionA: "A",
    optionB: "B",
    optionC: "C",
    optionD: "D",
    optionAVi: null,
    optionBVi: null,
    optionCVi: null,
    optionDVi: null,
    answerKey: "A",
    explanationVi: null,
  };
}

function makeGroup(
  id: number,
  questionStart: number,
  questionEnd: number,
  questions: AdminToeicTestRawQuestion[],
): AdminToeicTestRawGroup {
  return {
    id,
    questionStart,
    questionEnd,
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

describe("buildAdminToeicRunSteps", () => {
  it("creates one question step per question in part 1", () => {
    const steps = buildAdminToeicRunSteps([
      {
        partNumber: 1,
        groups: [
          makeGroup(1, 1, 1, [makeQuestion(101, 1)]),
          makeGroup(2, 2, 2, [makeQuestion(102, 2)]),
        ],
      },
    ]);

    expect(steps).toHaveLength(2);
    expect(steps[0]).toMatchObject({
      kind: "question",
      partNumber: 1,
      question: { id: 101, questionNumber: 1 },
    });
    expect(steps[1]).toMatchObject({
      kind: "question",
      partNumber: 1,
      question: { id: 102, questionNumber: 2 },
    });
  });

  it("creates one group step for part 3 multi-question groups", () => {
    const steps = buildAdminToeicRunSteps([
      {
        partNumber: 3,
        groups: [
          makeGroup(10, 32, 34, [
            makeQuestion(320, 32),
            makeQuestion(321, 33),
            makeQuestion(322, 34),
          ]),
        ],
      },
    ]);

    expect(steps).toHaveLength(1);
    expect(steps[0]).toMatchObject({
      kind: "group",
      partNumber: 3,
      group: {
        id: 10,
        questionStart: 32,
        questionEnd: 34,
      },
    });

    if (steps[0]?.kind === "group") {
      expect(steps[0].group.questions.map((question) => question.id)).toEqual([
        320, 321, 322,
      ]);
    }
  });

  it("resolves grid click on question 33 to the Q32-34 group step", () => {
    const steps = buildAdminToeicRunSteps([
      {
        partNumber: 3,
        groups: [
          makeGroup(10, 32, 34, [
            makeQuestion(320, 32),
            makeQuestion(321, 33),
            makeQuestion(322, 34),
          ]),
        ],
      },
    ]);

    expect(findAdminStepIndexForQuestionId(steps, 321)).toBe(0);
    expect(findAdminStepIndexForQuestionId(steps, 320)).toBe(0);
    expect(findAdminStepIndexForQuestionId(steps, 322)).toBe(0);
  });
});
