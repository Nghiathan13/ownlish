import { describe, expect, it } from "vitest";
import {
  mergeGroupIntoDetailCache,
  replaceGroupInTestDetail,
} from "@/features/admin/toeic/detail/lib/mergeGroupIntoDetailCache";
import type {
  AdminToeicGroupRaw,
  AdminToeicTestRawGroup,
  AdminToeicTestRawResponse,
} from "@/features/admin/toeic/api/types";

const previous: AdminToeicTestRawGroup = {
  id: 101,
  questionStart: 1,
  questionEnd: 3,
  groupType: "single",
  accent: "us",
  content: "Passage",
  contentVi: null,
  audioUrl: "https://audio.example/test.mp3",
  audioUrlExpiresAt: "2026-06-26T12:00:00.000Z",
  imageUrl: "https://image.example/test.png",
  imageUrlExpiresAt: "2026-06-26T12:00:00.000Z",
  questions: [],
};

const saved: AdminToeicGroupRaw = {
  id: 101,
  testId: 5,
  partNumber: 4,
  questionStart: 1,
  questionEnd: 3,
  groupType: "updated",
  accent: "uk",
  content: "Updated passage",
  contentVi: "Updated VI",
  audioStoragePath: "toeic/audio/test.mp3",
  imageStoragePath: "toeic/image/test.png",
  questions: [
    {
      id: 1001,
      questionNumber: 1,
      question: "Updated Q1",
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
  ],
};

describe("mergeGroupIntoDetailCache", () => {
  it("updates editable fields and preserves signed media URLs", () => {
    expect(mergeGroupIntoDetailCache(previous, saved)).toEqual({
      id: 101,
      questionStart: 1,
      questionEnd: 3,
      groupType: "updated",
      accent: "uk",
      content: "Updated passage",
      contentVi: "Updated VI",
      audioUrl: previous.audioUrl,
      audioUrlExpiresAt: previous.audioUrlExpiresAt,
      imageUrl: previous.imageUrl,
      imageUrlExpiresAt: previous.imageUrlExpiresAt,
      questions: saved.questions,
    });
  });
});

describe("replaceGroupInTestDetail", () => {
  it("replaces the matching group in the cached test detail", () => {
    const data: AdminToeicTestRawResponse = {
      test: { id: 5, year: 2026, testNumber: 1 },
      parts: [
        {
          partNumber: 4,
          groups: [previous, { ...previous, id: 102 }],
        },
      ],
    };
    const updated = mergeGroupIntoDetailCache(previous, saved);

    expect(replaceGroupInTestDetail(data, updated)).toEqual({
      test: data.test,
      parts: [
        {
          partNumber: 4,
          groups: [updated, data.parts[0].groups[1]],
        },
      ],
    });
  });
});
