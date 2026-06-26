import { describe, expect, it } from "vitest";
import {
  cloneAdminToeicGroupDraft,
  isAdminToeicGroupDraftDirty,
  shouldShowAdminGroupEdit,
} from "@/features/admin/toeic/lib/adminGroupEditorState";
import type { AdminToeicGroupRaw } from "@/features/admin/toeic/api/types";

const baseline: AdminToeicGroupRaw = {
  id: 101,
  testId: 5,
  partNumber: 4,
  questionStart: 1,
  questionEnd: 3,
  groupType: "single",
  accent: "us",
  content: "Passage",
  contentVi: null,
  audioStoragePath: null,
  imageStoragePath: null,
  questions: [
    {
      id: 1001,
      questionNumber: 1,
      question: "Q1",
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
  ],
};

describe("adminGroupEditorState", () => {
  it("detects dirty drafts", () => {
    const draft = cloneAdminToeicGroupDraft(baseline);
    expect(isAdminToeicGroupDraftDirty(baseline, draft)).toBe(false);

    draft.content = "Updated";
    expect(isAdminToeicGroupDraftDirty(baseline, draft)).toBe(true);
  });

  it("shows edit only for admin users", () => {
    expect(shouldShowAdminGroupEdit(true)).toBe(true);
    expect(shouldShowAdminGroupEdit(false)).toBe(false);
  });
});
