import type {
  AdminToeicGroupFields,
  AdminToeicGroupPatchInput,
  AdminToeicQuestionFields,
  AdminToeicQuestionPatchInput,
  AdminToeicTestRawGroup,
} from "@/features/admin/toeic/api/types";

export type AdminQuestionEditorEntry = {
  id: number;
  questionNumber: number;
  baseline: AdminToeicQuestionFields;
  draft: AdminToeicQuestionFields;
};

export type AdminGroupEditorState = {
  groupId: number;
  baselineGroup: AdminToeicGroupFields;
  draftGroup: AdminToeicGroupFields;
  questions: AdminQuestionEditorEntry[];
};

export type AdminGroupPatchPlan = {
  patch: AdminToeicGroupPatchInput;
  changedFields: Array<keyof AdminToeicGroupFields>;
};

export type AdminQuestionPatchPlan = {
  questionId: number;
  questionNumber: number;
  patch: AdminToeicQuestionPatchInput;
};

const GROUP_FIELD_LABELS: Record<keyof AdminToeicGroupFields, string> = {
  groupType: "group type",
  accent: "accent",
  content: "group content",
  contentVi: "group content (VI)",
};

const GROUP_FIELD_KEYS = [
  "groupType",
  "accent",
  "content",
  "contentVi",
] as const satisfies ReadonlyArray<keyof AdminToeicGroupFields>;

const QUESTION_STRING_FIELD_KEYS = [
  "question",
  "questionVi",
  "questionType",
  "optionA",
  "optionB",
  "optionC",
  "optionD",
  "optionAVi",
  "optionBVi",
  "optionCVi",
  "optionDVi",
  "explanationVi",
] as const satisfies ReadonlyArray<keyof AdminToeicQuestionFields>;

export function normalizeEditorNullableString(
  value: string | null | undefined,
): string | null {
  if (value == null) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

function pickGroupFields(group: AdminToeicTestRawGroup): AdminToeicGroupFields {
  return {
    groupType: group.groupType,
    accent: group.accent,
    content: group.content,
    contentVi: group.contentVi,
  };
}

function pickQuestionFields(
  question: AdminToeicTestRawGroup["questions"][number],
): AdminToeicQuestionFields {
  return {
    question: question.question,
    questionVi: question.questionVi,
    questionType: question.questionType,
    optionA: question.optionA,
    optionB: question.optionB,
    optionC: question.optionC,
    optionD: question.optionD,
    optionAVi: question.optionAVi,
    optionBVi: question.optionBVi,
    optionCVi: question.optionCVi,
    optionDVi: question.optionDVi,
    answerKey: question.answerKey,
    explanationVi: question.explanationVi,
  };
}

export function createEditorStateFromGroup(
  group: AdminToeicTestRawGroup,
): AdminGroupEditorState {
  const baselineGroup = pickGroupFields(group);

  return {
    groupId: group.id,
    baselineGroup,
    draftGroup: { ...baselineGroup },
    questions: group.questions.map((question) => {
      const baseline = pickQuestionFields(question);

      return {
        id: question.id,
        questionNumber: question.questionNumber,
        baseline,
        draft: { ...baseline },
      };
    }),
  };
}

export function cloneEditorState(
  state: AdminGroupEditorState,
): AdminGroupEditorState {
  return {
    groupId: state.groupId,
    baselineGroup: { ...state.baselineGroup },
    draftGroup: { ...state.draftGroup },
    questions: state.questions.map((question) => ({
      ...question,
      baseline: { ...question.baseline },
      draft: { ...question.draft },
    })),
  };
}

function isFieldDirty<T extends Record<string, unknown>>(
  baseline: T,
  draft: T,
  key: keyof T,
) {
  const left = baseline[key];
  const right = draft[key];

  if (typeof left === "string" || typeof right === "string" || left === null || right === null) {
    return (
      normalizeEditorNullableString(left as string | null) !==
      normalizeEditorNullableString(right as string | null)
    );
  }

  return left !== right;
}

export function isEditorDirty(state: AdminGroupEditorState) {
  return (
    buildGroupPatch(state) != null ||
    buildQuestionPatches(state).length > 0
  );
}

export function buildGroupPatch(
  state: AdminGroupEditorState,
): AdminGroupPatchPlan | null {
  const patch: AdminToeicGroupPatchInput = {};
  const changedFields: Array<keyof AdminToeicGroupFields> = [];

  for (const key of GROUP_FIELD_KEYS) {
    if (isFieldDirty(state.baselineGroup, state.draftGroup, key)) {
      patch[key] = state.draftGroup[key];
      changedFields.push(key);
    }
  }

  return changedFields.length > 0 ? { patch, changedFields } : null;
}

export function buildQuestionPatches(
  state: AdminGroupEditorState,
): AdminQuestionPatchPlan[] {
  const patches: AdminQuestionPatchPlan[] = [];

  for (const question of state.questions) {
    const patch: AdminToeicQuestionPatchInput = {};

    for (const key of QUESTION_STRING_FIELD_KEYS) {
      if (isFieldDirty(question.baseline, question.draft, key)) {
        patch[key] = question.draft[key];
      }
    }

    if (isFieldDirty(question.baseline, question.draft, "answerKey")) {
      patch.answerKey = question.draft.answerKey;
    }

    if (Object.keys(patch).length > 0) {
      patches.push({
        questionId: question.id,
        questionNumber: question.questionNumber,
        patch,
      });
    }
  }

  return patches;
}

export function applySuccessfulGroupSave(
  state: AdminGroupEditorState,
  savedGroup: AdminGroupPatchPlan["patch"] & { id: number },
): AdminGroupEditorState {
  const next = cloneEditorState(state);

  for (const key of GROUP_FIELD_KEYS) {
    if (savedGroup[key] !== undefined) {
      next.baselineGroup[key] = savedGroup[key] ?? null;
      next.draftGroup[key] = savedGroup[key] ?? null;
    }
  }

  return next;
}

export function applySuccessfulQuestionSave(
  state: AdminGroupEditorState,
  savedQuestion: AdminQuestionPatchPlan["patch"] & { id: number },
): AdminGroupEditorState {
  const next = cloneEditorState(state);
  const question = next.questions.find((entry) => entry.id === savedQuestion.id);

  if (!question) {
    return next;
  }

  for (const key of QUESTION_STRING_FIELD_KEYS) {
    if (savedQuestion[key] !== undefined) {
      const value = savedQuestion[key] ?? null;
      question.baseline[key] = value;
      question.draft[key] = value;
    }
  }

  if (savedQuestion.answerKey !== undefined) {
    question.baseline.answerKey = savedQuestion.answerKey;
    question.draft.answerKey = savedQuestion.answerKey;
  }

  return next;
}

export function formatGroupSaveErrorLabel(
  changedFields: Array<keyof AdminToeicGroupFields>,
) {
  const labels = changedFields.map((field) => GROUP_FIELD_LABELS[field]);

  if (labels.length === 1) {
    return labels[0];
  }

  if (labels.length === 2) {
    return `${labels[0]} and ${labels[1]}`;
  }

  return `${labels.slice(0, -1).join(", ")}, and ${labels.at(-1)}`;
}

export function formatQuestionSaveErrorLabel(questionNumber: number) {
  return `question ${questionNumber}`;
}
