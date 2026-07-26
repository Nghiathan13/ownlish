import { describe, expect, it } from "vitest";
import { buildAnswerKeyMap } from "./answerKeyMap";
import type { ToeicQuestionGroup } from "@/entities/toeic-runtime/model/presentation";

const groups: ToeicQuestionGroup[] = [
  {
    id: 1,
    partNumber: 1,
    questionStart: 1,
    questionEnd: 2,
    groupStatus: null,
    groupType: null,
    accent: null,
    content: null,
    contentVi: null,
    audioUrl: null,
    audioUrlExpiresAt: null,
    imageUrl: null,
    imageUrlExpiresAt: null,
    questions: [
      {
        id: 10,
        questionNumber: 1,
        sessionQuestionNumber: 1,
        question: "Q1",
        questionVi: null,
        optionCount: 4,
        answerKey: "A",
        selectedKey: null,
        status: null,
        isCorrect: null,
        options: {
          A: "a",
          B: "b",
          C: "c",
          D: "d",
          A_vi: null,
          B_vi: null,
          C_vi: null,
          D_vi: null,
        },
      },
      {
        id: 11,
        questionNumber: 2,
        sessionQuestionNumber: 2,
        question: "Q2",
        questionVi: null,
        optionCount: 4,
        answerKey: null,
        selectedKey: null,
        status: null,
        isCorrect: null,
        options: {
          A: "a",
          B: "b",
          C: "c",
          D: "d",
          A_vi: null,
          B_vi: null,
          C_vi: null,
          D_vi: null,
        },
      },
    ],
  },
];

describe("buildAnswerKeyMap", () => {
  it("maps question ids to answer keys when present", () => {
    const map = buildAnswerKeyMap(groups);

    expect(map.get(10)).toBe("A");
    expect(map.has(11)).toBe(false);
  });
});
