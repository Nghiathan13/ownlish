import { describe, expect, it } from "vitest";
import type { ToeicCatalogSource } from "@/entities/toeic-catalog/model/types";
import type { ToeicRuntimeRun } from "./types";
import { materializePartPracticeSession } from "./materializePartPracticeSession";

const GROUP_KEY = "ets26-t01-p3-g032-034";
const QUESTION_KEY = "ets26-t01-p3-q032";

const source: ToeicCatalogSource = {
  rootUrl: "https://cdn.example.com/toeic/",
  manifest: {
    schemaVersion: 1,
    tests: [],
    partPractice: [{ number: 3, path: "part-practice/part_3.json", questionCount: 39 }],
    mediaByGroupId: {
      [GROUP_KEY]: { audio: "ets_26/test_01/032.mp3" },
    },
  },
};

const run: ToeicRuntimeRun = {
  sessionId: "session-id",
  scope: "part_practice",
  testKey: null,
  partNumber: 3,
  mode: "practice",
  selectedParts: [3],
  correctCount: 0,
  wrongCount: 0,
  timer: null,
  finish: { status: "open" },
  answers: [],
};

describe("materializePartPracticeSession", () => {
  it("keeps the static group key beside its UI group id", () => {
    const session = materializePartPracticeSession(
      {
        totalQuestions: 1,
        groups: [
          {
            id: GROUP_KEY,
            kind: "conversation",
            test: { year: 2026, testNumber: 1 },
            questions: [
              {
                id: QUESTION_KEY,
                number: 32,
                question: { en: "What is the caller asking about?", vi: "" },
                options: [
                  { key: "A", en: "An order", vi: "" },
                  { key: "B", en: "A meeting", vi: "" },
                  { key: "C", en: "A delivery", vi: "" },
                  { key: "D", en: "A refund", vi: "" },
                ],
                answer: "A",
              },
            ],
          },
        ],
      },
      source,
      run,
      "practice",
    );

    expect(session.groupKeyById).toEqual(new Map([[1, GROUP_KEY]]));
    expect(session.questionKeyById).toEqual(new Map([[1, QUESTION_KEY]]));
    expect(session.groups[0]?.audioUrl).toBe(
      "https://cdn.example.com/toeic/ets_26/test_01/032.mp3",
    );
  });

  it("keeps full review_wrong groups, masks wrong answers, and keeps right answers", () => {
    const rightKey = "ets26-t01-p3-q032";
    const wrongKey = "ets26-t01-p3-q033";
    const allRightGroupKey = "ets26-t01-p3-g035-037";

    const session = materializePartPracticeSession(
      {
        totalQuestions: 3,
        groups: [
          {
            id: GROUP_KEY,
            kind: "conversation",
            test: { year: 2026, testNumber: 1 },
            questions: [
              {
                id: rightKey,
                number: 32,
                question: { en: "Right?", vi: "" },
                options: [
                  { key: "A", en: "A", vi: "" },
                  { key: "B", en: "B", vi: "" },
                  { key: "C", en: "C", vi: "" },
                  { key: "D", en: "D", vi: "" },
                ],
                answer: "A",
              },
              {
                id: wrongKey,
                number: 33,
                question: { en: "Wrong?", vi: "" },
                options: [
                  { key: "A", en: "A", vi: "" },
                  { key: "B", en: "B", vi: "" },
                  { key: "C", en: "C", vi: "" },
                  { key: "D", en: "D", vi: "" },
                ],
                answer: "B",
              },
            ],
          },
          {
            id: allRightGroupKey,
            kind: "conversation",
            test: { year: 2026, testNumber: 1 },
            questions: [
              {
                id: "ets26-t01-p3-q035",
                number: 35,
                question: { en: "Also right?", vi: "" },
                options: [
                  { key: "A", en: "A", vi: "" },
                  { key: "B", en: "B", vi: "" },
                  { key: "C", en: "C", vi: "" },
                  { key: "D", en: "D", vi: "" },
                ],
                answer: "C",
              },
            ],
          },
        ],
      },
      source,
      {
        ...run,
        correctCount: 2,
        wrongCount: 1,
        answers: [
          { questionKey: rightKey, selectedKey: "A", status: "right" },
          { questionKey: wrongKey, selectedKey: "A", status: "wrong" },
          {
            questionKey: "ets26-t01-p3-q035",
            selectedKey: "C",
            status: "right",
          },
        ],
      },
      "review_wrong",
    );

    expect(session.mode).toBe("review_wrong");
    expect(session.totalQuestions).toBe(2);
    expect(session.groups).toHaveLength(1);
    expect(session.groups[0]).toMatchObject({
      groupStatus: null,
      questions: [
        {
          questionNumber: 32,
          selectedKey: "A",
          status: "right",
          isCorrect: true,
        },
        {
          questionNumber: 33,
          selectedKey: null,
          status: null,
          isCorrect: null,
        },
      ],
    });
  });
});
