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
});
