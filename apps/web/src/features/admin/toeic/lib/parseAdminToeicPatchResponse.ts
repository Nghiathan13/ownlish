import type {
  AdminToeicGroupPatchResponse,
  AdminToeicQuestionPatchResponse,
} from "@/features/admin/toeic/api/types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseNullableString(value: unknown): string | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  if (typeof value === "string") {
    return value;
  }

  throw new Error("Invalid string field in admin TOEIC patch response");
}

function parseAnswerKey(value: unknown): "A" | "B" | "C" | "D" | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  if (value === "A" || value === "B" || value === "C" || value === "D") {
    return value;
  }

  throw new Error("Invalid answerKey in admin TOEIC patch response");
}

export function parseAdminToeicGroupPatchResponse(
  body: unknown,
): AdminToeicGroupPatchResponse {
  if (!isRecord(body) || !isRecord(body.group)) {
    throw new Error("Invalid admin TOEIC group patch response");
  }

  const group = body.group;

  if (typeof group.id !== "number") {
    throw new Error("Invalid admin TOEIC group patch response");
  }

  return {
    group: {
      id: group.id,
      groupType: parseNullableString(group.groupType),
      accent: parseNullableString(group.accent),
      content: parseNullableString(group.content),
      contentVi: parseNullableString(group.contentVi),
    },
  };
}

export function parseAdminToeicQuestionPatchResponse(
  body: unknown,
): AdminToeicQuestionPatchResponse {
  if (!isRecord(body) || !isRecord(body.question)) {
    throw new Error("Invalid admin TOEIC question patch response");
  }

  const question = body.question;

  if (typeof question.id !== "number") {
    throw new Error("Invalid admin TOEIC question patch response");
  }

  return {
    question: {
      id: question.id,
      question: parseNullableString(question.question),
      questionVi: parseNullableString(question.questionVi),
      questionType: parseNullableString(question.questionType),
      optionA: parseNullableString(question.optionA),
      optionB: parseNullableString(question.optionB),
      optionC: parseNullableString(question.optionC),
      optionD: parseNullableString(question.optionD),
      optionAVi: parseNullableString(question.optionAVi),
      optionBVi: parseNullableString(question.optionBVi),
      optionCVi: parseNullableString(question.optionCVi),
      optionDVi: parseNullableString(question.optionDVi),
      answerKey: parseAnswerKey(question.answerKey),
      explanationVi: parseNullableString(question.explanationVi),
    },
  };
}
