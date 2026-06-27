import { describe, expect, it } from "vitest";
import {
  parseAdminGroupRawEditTxt,
  serializeAdminGroupRawEditTxt,
} from "@/features/admin/toeic/detail/lib/adminGroupRawEditTxt";
import {
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
  content: "W: Hello\n{{q32}}Where is the meeting?{{/q32}}",
  contentVi: "Chào",
  audioUrl: null,
  audioUrlExpiresAt: null,
  imageUrl: null,
  imageUrlExpiresAt: null,
  questions: [
    {
      id: 320,
      questionNumber: 32,
      question: "Where is the meeting?",
      questionVi: "Cuộc họp ở đâu?",
      questionType: null,
      optionA: "In room 3",
      optionB: "On the second floor",
      optionC: "At the front desk",
      optionD: "Next to the elevator",
      optionAVi: "Ở phòng 3",
      optionBVi: "Ở tầng hai",
      optionCVi: "Ở quầy",
      optionDVi: "Cạnh thang máy",
      answerKey: "A",
      explanationVi: null,
    },
    {
      id: 321,
      questionNumber: 33,
      question: "Q33",
      questionVi: "Hỏi 33",
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
      questionVi: "Hỏi 34",
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

describe("adminGroupRawEditTxt", () => {
  it("round-trips part 3 txt without changing draft", () => {
    const state = createEditorStateFromGroup(part3Group);
    const txt = serializeAdminGroupRawEditTxt(state, 3);
    const parsed = parseAdminGroupRawEditTxt(txt, state, 3);

    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      return;
    }

    expect(parsed.state.draftGroup).toEqual(state.draftGroup);
    expect(parsed.state.questions.map((question) => question.draft)).toEqual(
      state.questions.map((question) => question.draft),
    );
  });

  it("preserves multiline content in heredoc", () => {
    const state = createEditorStateFromGroup(part3Group);
    const txt = serializeAdminGroupRawEditTxt(state, 3);

    expect(txt).toContain("# content\n<<<\nW: Hello");
    expect(txt).toContain("{{q32}}Where is the meeting?{{/q32}}\n>>>");

    const parsed = parseAdminGroupRawEditTxt(txt, state, 3);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      return;
    }

    expect(parsed.state.draftGroup.content).toBe(part3Group.content);
  });

  it("applies bilingual question edits with Q. and (A) lines", () => {
    const state = createEditorStateFromGroup(part3Group);
    const txt = serializeAdminGroupRawEditTxt(state, 3);
    const updated = txt.replace("Q. Where is the meeting?", "Q. Updated question");
    const parsed = parseAdminGroupRawEditTxt(updated, state, 3);

    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      return;
    }

    expect(parsed.state.questions[0]?.draft.question).toBe("Updated question");
    expect(buildQuestionPatches(parsed.state)).toEqual([
      {
        questionId: 320,
        questionNumber: 32,
        patch: { question: "Updated question" },
      },
    ]);
  });

  it("omits Q. lines for part 1 and still round-trips", () => {
    const state = createEditorStateFromGroup(part1Group);
    const txt = serializeAdminGroupRawEditTxt(state, 1);

    expect(txt).not.toContain("Q.");
    expect(txt).toContain("# questionEn");
    expect(txt).toContain("# questionVi");

    const parsed = parseAdminGroupRawEditTxt(txt, state, 1);
    expect(parsed.ok).toBe(true);
  });

  it("rejects Q. lines in part 1", () => {
    const state = createEditorStateFromGroup(part1Group);
    const txt = serializeAdminGroupRawEditTxt(state, 1);
    const updated = txt.replace("# questionEn", "# questionEn\nQ. Hidden");

    const parsed = parseAdminGroupRawEditTxt(updated, state, 1);
    expect(parsed).toEqual({
      ok: false,
      error: "question 1 # questionEn: question text is not editable in this part",
    });
  });

  it("produces the expected patch for txt question edits", () => {
    const state = createEditorStateFromGroup(part3Group);
    const txt = serializeAdminGroupRawEditTxt(state, 3);
    const updatedTxt = txt.replace(
      "Q. Where is the meeting?",
      "Q. Shared update",
    );

    const txtParsed = parseAdminGroupRawEditTxt(updatedTxt, state, 3);
    expect(txtParsed.ok).toBe(true);
    if (!txtParsed.ok) {
      return;
    }

    expect(buildQuestionPatches(txtParsed.state)).toEqual([
      {
        questionId: 320,
        questionNumber: 32,
        patch: { question: "Shared update" },
      },
    ]);
  });
});
