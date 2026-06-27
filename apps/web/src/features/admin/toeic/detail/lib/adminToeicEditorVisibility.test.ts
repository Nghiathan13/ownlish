import { describe, expect, it } from "vitest";
import {
  isAdminToeicGroupEditorFieldVisible,
  isAdminToeicQuestionEditorFieldVisible,
} from "./adminToeicEditorVisibility";

describe("adminToeicEditorVisibility", () => {
  it("hides part 1 photo-only fields", () => {
    expect(isAdminToeicGroupEditorFieldVisible(1, "groupType")).toBe(false);
    expect(isAdminToeicGroupEditorFieldVisible(1, "accent")).toBe(true);
    expect(isAdminToeicQuestionEditorFieldVisible(1, "questionType")).toBe(false);
    expect(isAdminToeicQuestionEditorFieldVisible(1, "question")).toBe(false);
    expect(isAdminToeicQuestionEditorFieldVisible(1, "questionVi")).toBe(false);
    expect(isAdminToeicQuestionEditorFieldVisible(1, "explanationVi")).toBe(false);
  });

  it("hides the whole group editor for part 5", () => {
    expect(isAdminToeicGroupEditorFieldVisible(5, "groupType")).toBe(false);
    expect(isAdminToeicGroupEditorFieldVisible(5, "accent")).toBe(false);
    expect(isAdminToeicGroupEditorFieldVisible(5, "content")).toBe(false);
    expect(isAdminToeicGroupEditorFieldVisible(5, "contentVi")).toBe(false);
  });

  it("hides part 6 accent and question prompt fields", () => {
    expect(isAdminToeicGroupEditorFieldVisible(6, "accent")).toBe(false);
    expect(isAdminToeicGroupEditorFieldVisible(6, "content")).toBe(true);
    expect(isAdminToeicQuestionEditorFieldVisible(6, "questionType")).toBe(false);
    expect(isAdminToeicQuestionEditorFieldVisible(6, "question")).toBe(false);
    expect(isAdminToeicQuestionEditorFieldVisible(6, "questionVi")).toBe(false);
    expect(isAdminToeicQuestionEditorFieldVisible(6, "explanationVi")).toBe(false);
  });

  it("keeps options and answer key visible in every part", () => {
    for (const partNumber of [1, 2, 3, 4, 5, 6, 7]) {
      expect(isAdminToeicQuestionEditorFieldVisible(partNumber, "optionA")).toBe(true);
      expect(isAdminToeicQuestionEditorFieldVisible(partNumber, "optionAVi")).toBe(true);
      expect(isAdminToeicQuestionEditorFieldVisible(partNumber, "answerKey")).toBe(true);
    }
  });
});
