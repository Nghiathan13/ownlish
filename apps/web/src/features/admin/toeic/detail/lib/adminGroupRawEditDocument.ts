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
import {
  getVisibleAdminToeicGroupEditorFields,
  getVisibleAdminToeicQuestionEditorFields,
  isAdminToeicGroupEditorFieldVisible,
  isAdminToeicQuestionEditorFieldVisible,
  type AdminToeicGroupEditorField,
  type AdminToeicQuestionEditorField,
} from "@/features/admin/toeic/detail/lib/adminToeicEditorVisibility";

export type AdminGroupRawEditQuestionDocument = Partial<AdminToeicQuestionFields>;

export type AdminGroupRawEditDocument = Partial<AdminToeicGroupFields> & {
  questions: AdminGroupRawEditQuestionDocument[];
};

const READ_ONLY_TOP_LEVEL_KEYS = new Set([
  "groupId",
  "questionStart",
  "questionEnd",
]);

const READ_ONLY_QUESTION_KEYS = new Set(["id", "questionNumber"]);

const GROUP_FIELD_KEYS = [
  "groupType",
  "accent",
  "content",
  "contentVi",
] as const satisfies ReadonlyArray<AdminToeicGroupEditorField>;

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
] as const satisfies ReadonlyArray<
  Exclude<AdminToeicQuestionEditorField, "answerKey">
>;

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

function getAllowedTopLevelKeys(partNumber: number) {
  return new Set<string>([
    "questions",
    ...getVisibleAdminToeicGroupEditorFields(partNumber),
  ]);
}

function getAllowedQuestionKeys(partNumber: number) {
  return new Set<string>(
    getVisibleAdminToeicQuestionEditorFields(partNumber).map(String),
  );
}

function findHiddenTopLevelKeys(
  parsed: Record<string, unknown>,
  partNumber: number,
) {
  return GROUP_FIELD_KEYS.filter(
    (key) =>
      key in parsed &&
      !isAdminToeicGroupEditorFieldVisible(partNumber, key),
  );
}

function isEditableQuestionField(key: string): key is AdminToeicQuestionEditorField {
  return (
    (QUESTION_STRING_FIELD_KEYS as readonly string[]).includes(key) ||
    key === "answerKey"
  );
}

function findHiddenQuestionKeys(
  rawQuestion: Record<string, unknown>,
  partNumber: number,
) {
  return Object.keys(rawQuestion).filter(
    (key): key is AdminToeicQuestionEditorField =>
      isEditableQuestionField(key) &&
      !isAdminToeicQuestionEditorFieldVisible(partNumber, key),
  );
}

function findReadOnlyTopLevelKeys(parsed: Record<string, unknown>) {
  return Object.keys(parsed).filter((key) => READ_ONLY_TOP_LEVEL_KEYS.has(key));
}

function findReadOnlyQuestionKeys(rawQuestion: Record<string, unknown>) {
  return Object.keys(rawQuestion).filter((key) =>
    READ_ONLY_QUESTION_KEYS.has(key),
  );
}

function serializeQuestionDraft(
  draft: AdminToeicQuestionFields,
  partNumber: number,
): AdminGroupRawEditQuestionDocument {
  const question: AdminGroupRawEditQuestionDocument = {};

  for (const field of getVisibleAdminToeicQuestionEditorFields(partNumber)) {
    if (field === "answerKey") {
      question.answerKey = draft.answerKey;
      continue;
    }

    question[field] = draft[field];
  }

  return question;
}

export function serializeAdminGroupRawEditDocument(
  state: AdminGroupEditorState,
  partNumber: number,
): string {
  const doc: Record<string, unknown> = {};

  for (const field of GROUP_FIELD_KEYS) {
    if (!isAdminToeicGroupEditorFieldVisible(partNumber, field)) {
      continue;
    }

    doc[field] = state.draftGroup[field];
  }

  doc.questions = state.questions.map((question) =>
    serializeQuestionDraft(question.draft, partNumber),
  );

  return JSON.stringify(doc, null, 2);
}

export type ParseAdminGroupRawEditDocumentResult =
  | { ok: true; state: AdminGroupEditorState }
  | { ok: false; error: string };

export function parseAdminGroupRawEditDocument(
  text: string,
  currentState: AdminGroupEditorState,
  partNumber: number,
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

  const hiddenTopLevelKeys = findHiddenTopLevelKeys(parsed, partNumber);
  if (hiddenTopLevelKeys.length > 0) {
    return {
      ok: false,
      error: `Fields not editable in this part must not be included: ${hiddenTopLevelKeys.join(", ")}`,
    };
  }

  const allowedTopLevelKeys = getAllowedTopLevelKeys(partNumber);
  const unknownTopLevelKeys = Object.keys(parsed).filter(
    (key) => !allowedTopLevelKeys.has(key),
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
  const visibleGroupFields = getVisibleAdminToeicGroupEditorFields(partNumber);
  const visibleQuestionFields =
    getVisibleAdminToeicQuestionEditorFields(partNumber);

  for (const key of visibleGroupFields) {
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

    const hiddenQuestionKeys = findHiddenQuestionKeys(rawQuestion, partNumber);
    if (hiddenQuestionKeys.length > 0) {
      return {
        ok: false,
        error: `Fields not editable in this part must not be included in ${path}: ${hiddenQuestionKeys.join(", ")}`,
      };
    }

    const allowedQuestionKeys = getAllowedQuestionKeys(partNumber);
    const unknownQuestionKeys = Object.keys(rawQuestion).filter(
      (key) => !allowedQuestionKeys.has(key),
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

    for (const key of visibleQuestionFields) {
      if (key === "answerKey") {
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
        continue;
      }

      if (!(key in rawQuestion)) {
        return { ok: false, error: `Missing field: ${path}.${key}` };
      }

      const parsedValue = parseNullableString(
        rawQuestion[key],
        `${path}.${key}`,
      );
      if (isParseError(parsedValue)) {
        return { ok: false, error: parsedValue.error };
      }

      questionEntry.draft[key] = parsedValue;
    }
  }

  return { ok: true, state: nextState };
}
