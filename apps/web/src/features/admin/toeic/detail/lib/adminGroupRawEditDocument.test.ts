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

const part3Group: AdminToeicTestRawGroup = {
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

const part1Group: AdminToeicTestRawGroup = {
  ...part3Group,
  id: 201,
  questionStart: 1,
  questionEnd: 1,
  groupType: null,
  content: null,
  contentVi: null,
  questions: [part3Group.questions[0]!],
};

const part5Group: AdminToeicTestRawGroup = {
  ...part3Group,
  id: 301,
  questionStart: 101,
  questionEnd: 101,
  groupType: null,
  accent: null,
  content: null,
  contentVi: null,
  questions: [part3Group.questions[0]!],
};

describe("adminGroupRawEditDocument", () => {
  it("omits read-only and part-hidden fields from serialized JSON for part 3", () => {
    const state = createEditorStateFromGroup(part3Group);
    const json = serializeAdminGroupRawEditDocument(state, 3);
    const document = JSON.parse(json) as Record<string, unknown>;

    expect(Object.keys(document)).toEqual([
      "groupType",
      "accent",
      "content",
      "contentVi",
      "questions",
    ]);

    expect(document).not.toHaveProperty("groupId");
    expect(document).not.toHaveProperty("questionStart");
    expect(document).not.toHaveProperty("questionEnd");

    const questions = document.questions as Array<Record<string, unknown>>;
    for (const question of questions) {
      expect(question).not.toHaveProperty("id");
      expect(question).not.toHaveProperty("questionNumber");
      expect(question).not.toHaveProperty("questionType");
      expect(question).not.toHaveProperty("explanationVi");
    }
  });

  it("omits part 1 group and question fields hidden in form edit", () => {
    const state = createEditorStateFromGroup(part1Group);
    const document = JSON.parse(
      serializeAdminGroupRawEditDocument(state, 1),
    ) as Record<string, unknown>;

    expect(document).not.toHaveProperty("groupType");
    expect(document).not.toHaveProperty("content");
    expect(document).not.toHaveProperty("contentVi");
    expect(document).toHaveProperty("accent");

    const question = (document.questions as Array<Record<string, unknown>>)[0]!;
    expect(question).not.toHaveProperty("question");
    expect(question).not.toHaveProperty("questionVi");
    expect(question).not.toHaveProperty("questionType");
    expect(question).not.toHaveProperty("explanationVi");
    expect(question).toHaveProperty("optionA");
    expect(question).toHaveProperty("answerKey");
  });

  it("omits all group fields for part 5", () => {
    const state = createEditorStateFromGroup(part5Group);
    const document = JSON.parse(
      serializeAdminGroupRawEditDocument(state, 5),
    ) as Record<string, unknown>;

    expect(document).not.toHaveProperty("groupType");
    expect(document).not.toHaveProperty("accent");
    expect(document).not.toHaveProperty("content");
    expect(document).not.toHaveProperty("contentVi");
    expect(document).toHaveProperty("questions");
  });

  it("round-trips serialize and parse without changing draft", () => {
    const state = createEditorStateFromGroup(part3Group);
    const json = serializeAdminGroupRawEditDocument(state, 3);
    const parsed = parseAdminGroupRawEditDocument(json, state, 3);

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
    const state = createEditorStateFromGroup(part3Group);
    const json = serializeAdminGroupRawEditDocument(state, 3);
    const document = JSON.parse(json) as Record<string, unknown>;
    document.content = "Updated passage";
    const questions = document.questions as Array<Record<string, unknown>>;
    questions[1]!.optionB = "Updated B";

    const parsed = parseAdminGroupRawEditDocument(
      JSON.stringify(document),
      state,
      3,
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
    const state = createEditorStateFromGroup(part3Group);
    const json = serializeAdminGroupRawEditDocument(state, 3);
    const document = JSON.parse(json) as Record<string, unknown>;
    document.contentVi = "   ";

    const parsed = parseAdminGroupRawEditDocument(
      JSON.stringify(document),
      state,
      3,
    );

    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      return;
    }

    expect(parsed.state.draftGroup.contentVi).toBeNull();
  });

  it("rejects invalid JSON", () => {
    const state = createEditorStateFromGroup(part3Group);
    const parsed = parseAdminGroupRawEditDocument("{", state, 3);

    expect(parsed).toEqual({ ok: false, error: "Invalid JSON syntax." });
  });

  it("rejects read-only top-level fields", () => {
    const state = createEditorStateFromGroup(part3Group);
    const json = serializeAdminGroupRawEditDocument(state, 3);
    const document = JSON.parse(json) as Record<string, unknown>;
    document.groupId = 101;

    const parsed = parseAdminGroupRawEditDocument(
      JSON.stringify(document),
      state,
      3,
    );

    expect(parsed).toEqual({
      ok: false,
      error: "Read-only fields must not be included: groupId",
    });
  });

  it("rejects part-hidden question fields", () => {
    const state = createEditorStateFromGroup(part3Group);
    const json = serializeAdminGroupRawEditDocument(state, 3);
    const document = JSON.parse(json) as Record<string, unknown>;
    const questions = document.questions as Array<Record<string, unknown>>;
    questions[0]!.explanationVi = "Hidden in part 3";

    const parsed = parseAdminGroupRawEditDocument(
      JSON.stringify(document),
      state,
      3,
    );

    expect(parsed).toEqual({
      ok: false,
      error:
        "Fields not editable in this part must not be included in questions[0]: explanationVi",
    });
  });

  it("rejects missing questions", () => {
    const state = createEditorStateFromGroup(part3Group);
    const json = serializeAdminGroupRawEditDocument(state, 3);
    const document = JSON.parse(json) as Record<string, unknown>;
    document.questions = [];

    const parsed = parseAdminGroupRawEditDocument(
      JSON.stringify(document),
      state,
      3,
    );

    expect(parsed).toEqual({
      ok: false,
      error: "questions must contain exactly 3 entries.",
    });
  });

  it("rejects invalid answerKey", () => {
    const state = createEditorStateFromGroup(part3Group);
    const json = serializeAdminGroupRawEditDocument(state, 3);
    const document = JSON.parse(json) as Record<string, unknown>;
    const questions = document.questions as Array<Record<string, unknown>>;
    questions[0]!.answerKey = "E";

    const parsed = parseAdminGroupRawEditDocument(
      JSON.stringify(document),
      state,
      3,
    );

    expect(parsed).toEqual({
      ok: false,
      error: "questions[0].answerKey must be A, B, C, D, or null",
    });
  });

  it("rejects unknown top-level keys", () => {
    const state = createEditorStateFromGroup(part3Group);
    const json = serializeAdminGroupRawEditDocument(state, 3);
    const document = JSON.parse(json) as Record<string, unknown>;
    document.audioUrl = "https://example.com/audio.mp3";

    const parsed = parseAdminGroupRawEditDocument(
      JSON.stringify(document),
      state,
      3,
    );

    expect(parsed).toEqual({
      ok: false,
      error: "Unknown top-level keys: audioUrl",
    });
  });
});
