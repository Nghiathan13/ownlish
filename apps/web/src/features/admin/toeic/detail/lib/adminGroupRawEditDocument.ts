import type {
  AdminToeicAnswerKey,
  AdminToeicGroupFields,
  AdminToeicQuestionFields,
} from "@/features/admin/toeic/api/types";
import {
  cloneEditorState,
  normalizeEditorNullableString,
  type AdminGroupEditorState,
} from "@/features/admin/toeic/detail/lib/adminGroupEditorState";

export type AdminGroupRawEditQuestionDocument = AdminToeicQuestionFields;

export type AdminGroupRawEditDocument = AdminToeicGroupFields & {
  questions: AdminGroupRawEditQuestionDocument[];
};

const READ_ONLY_TOP_LEVEL_KEYS = new Set([
  "groupId",
  "questionStart",
  "questionEnd",
]);

const READ_ONLY_QUESTION_KEYS = new Set(["id", "questionNumber"]);

const DOCUMENT_TOP_LEVEL_KEYS = new Set([
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

function findReadOnlyTopLevelKeys(parsed: Record<string, unknown>) {
  return Object.keys(parsed).filter((key) => READ_ONLY_TOP_LEVEL_KEYS.has(key));
}

function findReadOnlyQuestionKeys(rawQuestion: Record<string, unknown>) {
  return Object.keys(rawQuestion).filter((key) =>
    READ_ONLY_QUESTION_KEYS.has(key),
  );
}

export function serializeAdminGroupRawEditDocument(
  state: AdminGroupEditorState,
): string {
  const doc: AdminGroupRawEditDocument = {
    groupType: state.draftGroup.groupType,
    accent: state.draftGroup.accent,
    content: state.draftGroup.content,
    contentVi: state.draftGroup.contentVi,
    questions: state.questions.map((question) => ({ ...question.draft })),
  };

  return JSON.stringify(doc, null, 2);
}

export type ParseAdminGroupRawEditDocumentResult =
  | { ok: true; state: AdminGroupEditorState }
  | { ok: false; error: string };

export function parseAdminGroupRawEditDocument(
  text: string,
  currentState: AdminGroupEditorState,
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

  const readOnlyTopLevelKeys = findReadOnlyTopLevelKeys(parsed);
  if (readOnlyTopLevelKeys.length > 0) {
    return {
      ok: false,
      error: `Read-only fields must not be included: ${readOnlyTopLevelKeys.join(", ")}`,
    };
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

    const readOnlyQuestionKeys = findReadOnlyQuestionKeys(rawQuestion);
    if (readOnlyQuestionKeys.length > 0) {
      return {
        ok: false,
        error: `Read-only fields must not be included in ${path}: ${readOnlyQuestionKeys.join(", ")}`,
      };
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

    const questionEntry = nextState.questions[index];
    if (!questionEntry) {
      return { ok: false, error: `${path} is out of range.` };
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
