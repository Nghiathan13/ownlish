import { describe, expect, it } from "vitest";
import {
  cloneAdminToeicGroupDraft,
  createDraftFromTestRawGroup,
  isAdminToeicGroupDraftDirty,
  toAdminToeicGroupPatchInput,
} from "@/features/admin/toeic/detail/lib/adminGroupDraft";
import type { AdminToeicTestRawGroup } from "@/features/admin/toeic/api/types";

const group: AdminToeicTestRawGroup = {
  id: 101,
  questionStart: 1,
  questionEnd: 3,
  groupType: "single",
  accent: "us",
  content: "Passage",
  contentVi: null,
  audioUrl: "https://audio.example/test.mp3",
  audioUrlExpiresAt: "2026-06-26T12:00:00.000Z",
  imageUrl: null,
  imageUrlExpiresAt: null,
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

describe("createDraftFromTestRawGroup", () => {
  it("maps editable group fields from detail data", () => {
    expect(createDraftFromTestRawGroup(group)).toEqual({
      id: 101,
      questionStart: 1,
      questionEnd: 3,
      groupType: "single",
      accent: "us",
      content: "Passage",
      contentVi: null,
      questions: group.questions,
    });
  });
});

describe("isAdminToeicGroupDraftDirty", () => {
  it("detects dirty drafts", () => {
    const baseline = createDraftFromTestRawGroup(group);
    const draft = cloneAdminToeicGroupDraft(baseline);

    expect(isAdminToeicGroupDraftDirty(baseline, draft)).toBe(false);

    draft.content = "Updated";
    expect(isAdminToeicGroupDraftDirty(baseline, draft)).toBe(true);
  });
});

describe("toAdminToeicGroupPatchInput", () => {
  it("builds PATCH payload from draft", () => {
    const draft = createDraftFromTestRawGroup(group);

    expect(toAdminToeicGroupPatchInput(draft)).toEqual({
      group: {
        groupType: "single",
        accent: "us",
        content: "Passage",
        contentVi: null,
      },
      questions: [
        {
          id: 1001,
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
    });
  });
});
