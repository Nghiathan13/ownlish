import { describe, expect, it } from "vitest";
import type {
  AdminToeicTestRawGroup,
  AdminToeicTestRawQuestion,
} from "@/features/admin/toeic/api/types";
import {
  buildAdminToeicGroupCatalog,
  findAdminGroupIndexByGroupId,
  MAX_TOEIC_GROUP_INDEX,
} from "@/features/admin/toeic/detail/lib/adminToeicGroupCatalog";

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
): AdminToeicTestRawGroup {
  const questions = [];

  for (let number = questionStart; number <= questionEnd; number += 1) {
    questions.push(makeQuestion(id * 100 + number, number));
  }

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

describe("adminToeicGroupCatalog", () => {
  it("numbers groups across parts in part order", () => {
    const catalog = buildAdminToeicGroupCatalog([
      {
        partNumber: 3,
        groups: [makeGroup(10, 32, 34)],
      },
      {
        partNumber: 1,
        groups: [
          makeGroup(1, 1, 1),
          makeGroup(2, 2, 2),
        ],
      },
    ]);

    expect(catalog).toHaveLength(3);
    expect(catalog[0]).toMatchObject({ groupIndex: 1, partNumber: 1, group: { id: 1 } });
    expect(catalog[1]).toMatchObject({ groupIndex: 2, partNumber: 1, group: { id: 2 } });
    expect(catalog[2]).toMatchObject({ groupIndex: 3, partNumber: 3, group: { id: 10 } });
    expect(findAdminGroupIndexByGroupId(catalog, 10)).toBe(3);
  });

  it("uses the global TOEIC group index cap", () => {
    expect(MAX_TOEIC_GROUP_INDEX).toBe(103);
  });
});
