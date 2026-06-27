import { describe, expect, it } from "vitest";
import {
  parseAdminGroupRawEditDocument,
  serializeAdminGroupRawEditDocument,
} from "@/features/admin/toeic/detail/lib/adminGroupRawEditDocument";
import {
  buildGroupPatch,
  buildQuestionPatches,
  createEditorStateFromGroup,
} from "@/features/admin/toeic/detail/lib/adminGroupEditorState";
import type { AdminToeicTestRawGroup } from "@/features/admin/toeic/api/types";

const group: AdminToeicTestRawGroup = {
  id: 101,
  questionStart: 32,
  questionEnd: 34,
  groupType: "[\"conversation_2\"]",
  accent: "[\"W_Am\",\"M_Cn\"]",
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

describe("adminGroupRawEditDocument", () => {
  it("round-trips serialize and parse without changing draft", () => {
    const state = createEditorStateFromGroup(group);
    const json = serializeAdminGroupRawEditDocument(state, group);
    const parsed = parseAdminGroupRawEditDocument(json, state, group);

    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      return;
    }

    expect(parsed.state.draftGroup).toEqual(state.draftGroup);
    expect(parsed.state.questions.map((question) => question.draft)).toEqual(
      state.questions.map((question) => question.draft),
    );
  });

  it("applies content and question edits from parsed JSON", () => {
    const state = createEditorStateFromGroup(group);
    const json = serializeAdminGroupRawEditDocument(state, group);
    const document = JSON.parse(json) as Record<string, unknown>;
    document.content = "Updated passage";
    const questions = document.questions as Array<Record<string, unknown>>;
    questions[1]!.optionB = "Updated B";

    const parsed = parseAdminGroupRawEditDocument(
      JSON.stringify(document),
      state,
      group,
    );

    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      return;
    }

    expect(parsed.state.draftGroup.content).toBe("Updated passage");
    expect(parsed.state.questions[1]?.draft.optionB).toBe("Updated B");
    expect(buildGroupPatch(parsed.state)?.patch).toEqual({
      content: "Updated passage",
    });
    expect(buildQuestionPatches(parsed.state)).toEqual([
      {
        questionId: 321,
        questionNumber: 33,
        patch: { optionB: "Updated B" },
      },
    ]);
  });

  it("normalizes empty strings to null", () => {
    const state = createEditorStateFromGroup(group);
    const json = serializeAdminGroupRawEditDocument(state, group);
    const document = JSON.parse(json) as Record<string, unknown>;
    document.contentVi = "   ";

    const parsed = parseAdminGroupRawEditDocument(
      JSON.stringify(document),
      state,
      group,
    );

    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      return;
    }

    expect(parsed.state.draftGroup.contentVi).toBeNull();
  });

  it("rejects invalid JSON", () => {
    const state = createEditorStateFromGroup(group);
    const parsed = parseAdminGroupRawEditDocument("{", state, group);

    expect(parsed).toEqual({ ok: false, error: "Invalid JSON syntax." });
  });

  it("rejects mismatched groupId", () => {
    const state = createEditorStateFromGroup(group);
    const json = serializeAdminGroupRawEditDocument(state, group);
    const document = JSON.parse(json) as Record<string, unknown>;
    document.groupId = 999;

    const parsed = parseAdminGroupRawEditDocument(
      JSON.stringify(document),
      state,
      group,
    );

    expect(parsed).toEqual({ ok: false, error: "groupId must be 101." });
  });

  it("rejects missing questions", () => {
    const state = createEditorStateFromGroup(group);
    const json = serializeAdminGroupRawEditDocument(state, group);
    const document = JSON.parse(json) as Record<string, unknown>;
    document.questions = [];

    const parsed = parseAdminGroupRawEditDocument(
      JSON.stringify(document),
      state,
      group,
    );

    expect(parsed).toEqual({
      ok: false,
      error: "questions must contain exactly 3 entries.",
    });
  });

  it("rejects invalid answerKey", () => {
    const state = createEditorStateFromGroup(group);
    const json = serializeAdminGroupRawEditDocument(state, group);
    const document = JSON.parse(json) as Record<string, unknown>;
    const questions = document.questions as Array<Record<string, unknown>>;
    questions[0]!.answerKey = "E";

    const parsed = parseAdminGroupRawEditDocument(
      JSON.stringify(document),
      state,
      group,
    );

    expect(parsed).toEqual({
      ok: false,
      error: "questions[0].answerKey must be A, B, C, D, or null",
    });
  });

  it("rejects unknown top-level keys", () => {
    const state = createEditorStateFromGroup(group);
    const json = serializeAdminGroupRawEditDocument(state, group);
    const document = JSON.parse(json) as Record<string, unknown>;
    document.audioUrl = "https://example.com/audio.mp3";

    const parsed = parseAdminGroupRawEditDocument(
      JSON.stringify(document),
      state,
      group,
    );

    expect(parsed).toEqual({
      ok: false,
      error: "Unknown top-level keys: audioUrl",
    });
  });
});
