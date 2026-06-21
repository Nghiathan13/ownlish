import { describe, expect, it } from "vitest";
import {
  getSessionQuestionCount,
  getSessionQuestionPosition,
} from "./sessionQuestionPosition";

describe("sessionQuestionPosition", () => {
  it("uses session order instead of TOEIC question number gaps", () => {
    const groups = [
      {
        questions: Array.from({ length: 25 }, (_, index) => ({
          id: index + 7,
        })),
      },
      {
        questions: Array.from({ length: 30 }, (_, index) => ({
          id: index + 101,
        })),
      },
    ];

    expect(getSessionQuestionCount(groups)).toBe(55);
    expect(getSessionQuestionPosition(groups, 7)).toBe(1);
    expect(getSessionQuestionPosition(groups, 31)).toBe(25);
    expect(getSessionQuestionPosition(groups, 101)).toBe(26);
    expect(getSessionQuestionPosition(groups, 130)).toBe(55);
  });

  it("uses only visible questions when a reused run contains more parts", () => {
    const reusedRunGroups = [
      {
        questions: Array.from({ length: 6 }, (_, index) => ({
          id: index + 1,
        })),
      },
      {
        questions: Array.from({ length: 25 }, (_, index) => ({
          id: index + 7,
        })),
      },
      {
        questions: Array.from({ length: 30 }, (_, index) => ({
          id: index + 101,
        })),
      },
    ];
    const visiblePartOneGroups = reusedRunGroups.slice(0, 1);

    expect(getSessionQuestionCount(reusedRunGroups)).toBe(61);
    expect(getSessionQuestionCount(visiblePartOneGroups)).toBe(6);
    expect(getSessionQuestionPosition(visiblePartOneGroups, 1)).toBe(1);
    expect(getSessionQuestionPosition(visiblePartOneGroups, 6)).toBe(6);
  });
});
