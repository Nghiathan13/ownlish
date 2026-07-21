import { describe, expect, it } from "vitest";
import type { ToeicCatalogSource } from "@/entities/toeic-catalog/model/types";
import type { ToeicRuntimeRun } from "./types";
import { materializeTestSession } from "./materializeTestSession";

const TEST_KEY = "ets26-t01";
const PART_ONE_QUESTION_KEY = "ets26-t01-p1-q001";
const PART_THREE_GROUP_KEY = "ets26-t01-p3-g032-034";
const PART_THREE_QUESTION_KEY = "ets26-t01-p3-q032";

const source: ToeicCatalogSource = {
  rootUrl: "https://cdn.example.com/toeic/",
  manifest: {
    schemaVersion: 1,
    tests: [
      {
        id: TEST_KEY,
        series: "ETS 2026",
        year: 2026,
        testNumber: 1,
        complete: true,
        parts: [
          { number: 1, path: "ets_26/test_01/part_1.json", questionCount: 6 },
          { number: 3, path: "ets_26/test_01/part_3.json", questionCount: 39 },
        ],
      },
    ],
    partPractice: [],
    mediaByGroupId: {
      [PART_ONE_QUESTION_KEY]: {
        audio: "ets_26/test_01/audio/001.mp3",
        image: "ets_26/test_01/image/001.avif",
      },
      [PART_THREE_GROUP_KEY]: { audio: "ets_26/test_01/audio/032-034.mp3" },
    },
  },
};

const run: ToeicRuntimeRun = {
  sessionId: "session-id",
  scope: "test",
  testKey: TEST_KEY,
  partNumber: null,
  mode: "practice",
  selectedParts: [1, 3],
  correctCount: 1,
  wrongCount: 0,
  finish: { status: "open" },
  answers: [
    {
      questionKey: PART_ONE_QUESTION_KEY,
      selectedKey: "A",
      status: "right",
    },
  ],
};

describe("materializeTestSession", () => {
  it("normalizes single-question items and grouped questions into one session", () => {
    const session = materializeTestSession(
      [
        {
          partNumber: 1,
          document: {
            items: [
              {
                id: PART_ONE_QUESTION_KEY,
                number: 1,
                audioUrl: "ets_26/test_01/001.mp3",
                imageUrl: "ets_26/test_01/001.avif",
                options: [
                  { key: "A", en: "A", vi: "A" },
                  { key: "B", en: "B", vi: "B" },
                  { key: "C", en: "C", vi: "C" },
                  { key: "D", en: "D", vi: "D" },
                ],
                answer: "A",
              },
            ],
          },
        },
        {
          partNumber: 3,
          document: {
            groups: [
              {
                id: PART_THREE_GROUP_KEY,
                kind: "conversation",
                transcript: {
                  en: [
                    { text: "Listen carefully. ", questionIds: [] },
                    {
                      text: "What happened next?",
                      questionIds: [PART_THREE_QUESTION_KEY],
                    },
                  ],
                  vi: [
                    {
                      text: "Điều gì xảy ra tiếp theo?",
                      questionIds: [PART_THREE_QUESTION_KEY],
                    },
                  ],
                },
                questions: [
                  {
                    id: PART_THREE_QUESTION_KEY,
                    number: 32,
                    question: { en: "What happened?", vi: "Điều gì xảy ra?" },
                    options: [
                      { key: "A", en: "A", vi: "A" },
                      { key: "B", en: "B", vi: "B" },
                      { key: "C", en: "C", vi: "C" },
                      { key: "D", en: "D", vi: "D" },
                    ],
                    answer: "B",
                  },
                ],
              },
            ],
          },
        },
      ],
      source,
      run,
      "practice",
    );

    expect(session).toMatchObject({
      testKey: TEST_KEY,
      year: 2026,
      testNumber: 1,
      partNumbers: [1, 3],
      totalQuestions: 2,
    });
    expect(session.questionKeyById).toEqual(
      new Map([
        [1, PART_ONE_QUESTION_KEY],
        [2, PART_THREE_QUESTION_KEY],
      ]),
    );
    expect(session.groupKeyById).toEqual(
      new Map([
        [1, PART_ONE_QUESTION_KEY],
        [2, PART_THREE_GROUP_KEY],
      ]),
    );
    expect(session.groups[0]).toMatchObject({
      partNumber: 1,
      audioUrl: "https://cdn.example.com/toeic/ets_26/test_01/audio/001.mp3",
      imageUrl: "https://cdn.example.com/toeic/ets_26/test_01/image/001.avif",
      questions: [{ selectedKey: "A", status: "right" }],
    });
    expect(session.groups[1]).toMatchObject({
      partNumber: 3,
      audioUrl: "https://cdn.example.com/toeic/ets_26/test_01/audio/032-034.mp3",
      content: "Listen carefully. What happened next?",
      contentVi: "Điều gì xảy ra tiếp theo?",
    });
    expect(session.groups[1]?.contentSegments).toEqual([
      { type: "text", value: "Listen carefully. " },
      {
        type: "evidence",
        questionNumbers: [32],
        value: "What happened next?",
      },
    ]);
    expect(session.groups[1]?.contentViSegments).toEqual([
      {
        type: "evidence",
        questionNumbers: [32],
        value: "Điều gì xảy ra tiếp theo?",
      },
    ]);
  });

  it("keeps full review_wrong groups, masks wrong answers, and keeps right answers", () => {
    const rightKey = "ets26-t01-p3-q032";
    const wrongKey = "ets26-t01-p3-q033";
    const allRightGroupKey = "ets26-t01-p3-g035-037";

    const session = materializeTestSession(
      [
        {
          partNumber: 3,
          document: {
            groups: [
              {
                id: PART_THREE_GROUP_KEY,
                kind: "conversation",
                questions: [
                  {
                    id: rightKey,
                    number: 32,
                    question: { en: "Right?", vi: "" },
                    options: [
                      { key: "A", en: "A", vi: "A" },
                      { key: "B", en: "B", vi: "B" },
                      { key: "C", en: "C", vi: "C" },
                      { key: "D", en: "D", vi: "D" },
                    ],
                    answer: "A",
                  },
                  {
                    id: wrongKey,
                    number: 33,
                    question: { en: "Wrong?", vi: "" },
                    options: [
                      { key: "A", en: "A", vi: "A" },
                      { key: "B", en: "B", vi: "B" },
                      { key: "C", en: "C", vi: "C" },
                      { key: "D", en: "D", vi: "D" },
                    ],
                    answer: "B",
                  },
                ],
              },
              {
                id: allRightGroupKey,
                kind: "conversation",
                questions: [
                  {
                    id: "ets26-t01-p3-q035",
                    number: 35,
                    question: { en: "Also right?", vi: "" },
                    options: [
                      { key: "A", en: "A", vi: "A" },
                      { key: "B", en: "B", vi: "B" },
                      { key: "C", en: "C", vi: "C" },
                      { key: "D", en: "D", vi: "D" },
                    ],
                    answer: "C",
                  },
                ],
              },
            ],
          },
        },
      ],
      source,
      {
        ...run,
        selectedParts: [3],
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
