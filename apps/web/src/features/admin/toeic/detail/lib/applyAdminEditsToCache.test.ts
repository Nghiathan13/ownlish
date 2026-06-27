import { describe, expect, it } from "vitest";
import {
  applyAdminEditsToCache,
  replaceGroupInTestDetail,
} from "@/features/admin/toeic/detail/lib/applyAdminEditsToCache";
import type {
  AdminToeicTestRawGroup,
  AdminToeicTestRawResponse,
} from "@/features/admin/toeic/api/types";

const previous: AdminToeicTestRawGroup = {
  id: 101,
  questionStart: 32,
  questionEnd: 34,
  groupType: "triple",
  accent: "us",
  content: "Passage",
  contentVi: null,
  audioUrl: "https://audio.example/test.mp3",
  audioUrlExpiresAt: "2026-06-26T12:00:00.000Z",
  imageUrl: "https://image.example/test.png",
  imageUrlExpiresAt: "2026-06-26T12:00:00.000Z",
  questions: [
    {
      id: 320,
      questionNumber: 32,
      question: "Q32",
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
    },
    {
      id: 321,
      questionNumber: 33,
      question: "Q33",
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
      answerKey: "B",
      explanationVi: null,
    },
    {
      id: 322,
      questionNumber: 34,
      question: "Q34",
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
      answerKey: "C",
      explanationVi: null,
    },
  ],
};

describe("applyAdminEditsToCache", () => {
  it("merges group patch and preserves media URLs and questions", () => {
    expect(
      applyAdminEditsToCache(previous, {
        group: {
          id: 101,
          content: "Updated passage",
        },
      }),
    ).toEqual({
      ...previous,
      content: "Updated passage",
      questions: previous.questions,
    });
  });

  it("merges question patch and preserves sibling questions", () => {
    expect(
      applyAdminEditsToCache(previous, {
        questions: [
          {
            id: 321,
            question: "Updated Q33",
            answerKey: "D",
          },
        ],
      }),
    ).toEqual({
      ...previous,
      questions: [
        previous.questions[0],
        {
          ...previous.questions[1],
          question: "Updated Q33",
          answerKey: "D",
        },
        previous.questions[2],
      ],
    });
  });
});

describe("replaceGroupInTestDetail", () => {
  it("replaces the matching group in the cached test detail", () => {
    const data: AdminToeicTestRawResponse = {
      test: { id: 5, year: 2026, testNumber: 1 },
      parts: [
        {
          partNumber: 3,
          groups: [previous, { ...previous, id: 102 }],
        },
      ],
    };
    const updated = applyAdminEditsToCache(previous, {
      group: { id: 101, content: "Updated passage" },
    });

    expect(replaceGroupInTestDetail(data, updated)).toEqual({
      test: data.test,
      parts: [
        {
          partNumber: 3,
          groups: [updated, data.parts[0].groups[1]],
        },
      ],
    });
  });
});
