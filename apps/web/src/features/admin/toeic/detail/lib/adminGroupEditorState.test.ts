import { describe, expect, it } from "vitest";
import {
  buildGroupPatch,
  buildQuestionPatches,
  createEditorStateFromGroup,
  isEditorDirty,
} from "@/features/admin/toeic/detail/lib/adminGroupEditorState";
import type { AdminToeicTestRawGroup } from "@/features/admin/toeic/api/types";

const group: AdminToeicTestRawGroup = {
  id: 101,
  questionStart: 32,
  questionEnd: 34,
  groupType: "triple",
  accent: "us",
  content: "Passage",
  contentVi: null,
  audioUrl: null,
  audioUrlExpiresAt: null,
  imageUrl: null,
  imageUrlExpiresAt: null,
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

describe("adminGroupEditorState patch builders", () => {
  it("builds group patch only when group content changes", () => {
    const state = createEditorStateFromGroup(group);
    state.draftGroup.content = "Updated passage";

    expect(buildGroupPatch(state)).toEqual({
      patch: { content: "Updated passage" },
      changedFields: ["content"],
    });
    expect(buildQuestionPatches(state)).toEqual([]);
    expect(isEditorDirty(state)).toBe(true);
  });

  it("builds question patch only when one question changes", () => {
    const state = createEditorStateFromGroup(group);
    const question33 = state.questions.find((entry) => entry.id === 321);
    question33!.draft.question = "Updated Q33";

    expect(buildGroupPatch(state)).toBeNull();
    expect(buildQuestionPatches(state)).toEqual([
      {
        questionId: 321,
        questionNumber: 33,
        patch: { question: "Updated Q33" },
      },
    ]);
  });

  it("builds separate group and question patches without untouched questions", () => {
    const state = createEditorStateFromGroup(group);
    state.draftGroup.content = "Updated passage";
    const question33 = state.questions.find((entry) => entry.id === 321);
    question33!.draft.question = "Updated Q33";

    expect(buildGroupPatch(state)).toEqual({
      patch: { content: "Updated passage" },
      changedFields: ["content"],
    });
    expect(buildQuestionPatches(state)).toEqual([
      {
        questionId: 321,
        questionNumber: 33,
        patch: { question: "Updated Q33" },
      },
    ]);
  });
});
