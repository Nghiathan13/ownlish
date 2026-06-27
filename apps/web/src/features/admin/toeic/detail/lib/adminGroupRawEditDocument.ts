import type {
  AdminToeicAnswerKey,
  AdminToeicGroupFields,
  AdminToeicQuestionFields,
  AdminToeicTestRawGroup,
} from "@/features/admin/toeic/api/types";
import {
  cloneEditorState,
  normalizeEditorNullableString,
  type AdminGroupEditorState,
} from "@/features/admin/toeic/detail/lib/adminGroupEditorState";

export type AdminGroupRawEditQuestionDocument = {
  id: number;
  questionNumber: number;
} & AdminToeicQuestionFields;

export type AdminGroupRawEditDocument = {
  groupId: number;
  questionStart: number;
  questionEnd: number;
} & AdminToeicGroupFields & {
    questions: AdminGroupRawEditQuestionDocument[];
  };

const DOCUMENT_TOP_LEVEL_KEYS = new Set([
  "groupId",
  "questionStart",
  "questionEnd",
  "groupType",
  "accent",
  "content",
  "contentVi",
  "questions",
]);

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

const QUESTION_TOP_LEVEL_KEYS = new Set<string>([
  "id",
  "questionNumber",
  ...QUESTION_STRING_FIELD_KEYS,
  "answerKey",
]);

type ParseError = { error: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseNullableString(
  value: unknown,
  fieldPath: string,
): string | null | ParseError {
  if (value === null) {
    return null;
  }

  if (typeof value === "string") {
    return normalizeEditorNullableString(value);
  }

  return { error: `${fieldPath} must be a string or null` };
}

function parseAnswerKey(
  value: unknown,
  fieldPath: string,
): AdminToeicAnswerKey | ParseError {
  if (value === null) {
    return null;
  }

  if (value === "A" || value === "B" || value === "C" || value === "D") {
    return value;
  }

  return { error: `${fieldPath} must be A, B, C, D, or null` };
}

function isParseError<T>(value: T | ParseError): value is ParseError {
  return typeof value === "object" && value !== null && "error" in value;
}

export function serializeAdminGroupRawEditDocument(
  state: AdminGroupEditorState,
  group: Pick<AdminToeicTestRawGroup, "questionStart" | "questionEnd">,
): string {
  const doc: AdminGroupRawEditDocument = {
    groupId: state.groupId,
    questionStart: group.questionStart,
    questionEnd: group.questionEnd,
    groupType: state.draftGroup.groupType,
    accent: state.draftGroup.accent,
    content: state.draftGroup.content,
    contentVi: state.draftGroup.contentVi,
    questions: state.questions.map((question) => ({
      id: question.id,
      questionNumber: question.questionNumber,
      ...question.draft,
    })),
  };

  return JSON.stringify(doc, null, 2);
}

export type ParseAdminGroupRawEditDocumentResult =
  | { ok: true; state: AdminGroupEditorState }
  | { ok: false; error: string };

export function parseAdminGroupRawEditDocument(
  text: string,
  currentState: AdminGroupEditorState,
  group: Pick<AdminToeicTestRawGroup, "questionStart" | "questionEnd">,
): ParseAdminGroupRawEditDocumentResult {
  let parsed: unknown;

  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, error: "Invalid JSON syntax." };
  }

  if (!isRecord(parsed)) {
    return { ok: false, error: "Root value must be a JSON object." };
  }

  const unknownTopLevelKeys = Object.keys(parsed).filter(
    (key) => !DOCUMENT_TOP_LEVEL_KEYS.has(key),
  );

  if (unknownTopLevelKeys.length > 0) {
    return {
      ok: false,
      error: `Unknown top-level keys: ${unknownTopLevelKeys.join(", ")}`,
    };
  }

  if (parsed.groupId !== currentState.groupId) {
    return {
      ok: false,
      error: `groupId must be ${currentState.groupId}.`,
    };
  }

  if (parsed.questionStart !== group.questionStart) {
    return {
      ok: false,
      error: `questionStart must be ${group.questionStart}.`,
    };
  }

  if (parsed.questionEnd !== group.questionEnd) {
    return {
      ok: false,
      error: `questionEnd must be ${group.questionEnd}.`,
    };
  }

  if (!Array.isArray(parsed.questions)) {
    return { ok: false, error: "questions must be an array." };
  }

  if (parsed.questions.length !== currentState.questions.length) {
    return {
      ok: false,
      error: `questions must contain exactly ${currentState.questions.length} entries.`,
    };
  }

  const nextState = cloneEditorState(currentState);
  const questionsById = new Map(
    currentState.questions.map((question) => [question.id, question]),
  );

  for (const key of GROUP_FIELD_KEYS) {
    if (!(key in parsed)) {
      return { ok: false, error: `Missing field: ${key}` };
    }

    const parsedValue = parseNullableString(parsed[key], key);
    if (isParseError(parsedValue)) {
      return { ok: false, error: parsedValue.error };
    }

    nextState.draftGroup[key] = parsedValue;
  }

  for (let index = 0; index < parsed.questions.length; index += 1) {
    const rawQuestion = parsed.questions[index];
    const path = `questions[${index}]`;

    if (!isRecord(rawQuestion)) {
      return { ok: false, error: `${path} must be an object.` };
    }

    const unknownQuestionKeys = Object.keys(rawQuestion).filter(
      (key) => !QUESTION_TOP_LEVEL_KEYS.has(key),
    );

    if (unknownQuestionKeys.length > 0) {
      return {
        ok: false,
        error: `Unknown keys in ${path}: ${unknownQuestionKeys.join(", ")}`,
      };
    }

    if (typeof rawQuestion.id !== "number") {
      return { ok: false, error: `${path}.id must be a number.` };
    }

    const existingQuestion = questionsById.get(rawQuestion.id);
    if (!existingQuestion) {
      return {
        ok: false,
        error: `${path}.id ${rawQuestion.id} is not in this group.`,
      };
    }

    if (rawQuestion.questionNumber !== existingQuestion.questionNumber) {
      return {
        ok: false,
        error: `${path}.questionNumber must be ${existingQuestion.questionNumber}.`,
      };
    }

    const questionEntry = nextState.questions.find(
      (question) => question.id === existingQuestion.id,
    );

    if (!questionEntry) {
      return { ok: false, error: `${path}.id ${rawQuestion.id} is not in this group.` };
    }

    for (const key of QUESTION_STRING_FIELD_KEYS) {
      if (!(key in rawQuestion)) {
        return { ok: false, error: `Missing field: ${path}.${key}` };
      }

      const parsedValue = parseNullableString(rawQuestion[key], `${path}.${key}`);
      if (isParseError(parsedValue)) {
        return { ok: false, error: parsedValue.error };
      }

      questionEntry.draft[key] = parsedValue;
    }

    if (!("answerKey" in rawQuestion)) {
      return { ok: false, error: `Missing field: ${path}.answerKey` };
    }

    const parsedAnswerKey = parseAnswerKey(
      rawQuestion.answerKey,
      `${path}.answerKey`,
    );
    if (isParseError(parsedAnswerKey)) {
      return { ok: false, error: parsedAnswerKey.error };
    }

    questionEntry.draft.answerKey = parsedAnswerKey;
  }

  return { ok: true, state: nextState };
}
