import { apiRequest, invalidApiResponse } from "@/shared/api/http";
import { isNumber, isRecord, isString } from "@/shared/lib/parse";
import type {
  RuntimeAnswerStatus,
  ToeicRuntimePartPracticeSummary,
  ToeicRuntimeRun,
} from "../model/types";

type OptionKey = "A" | "B" | "C" | "D";

function parseOptionKey(value: unknown): OptionKey | null {
  return value === "A" || value === "B" || value === "C" || value === "D"
    ? value
    : null;
}

function parseAnswerStatus(value: unknown): RuntimeAnswerStatus | null {
  return value === "selected" || value === "right" || value === "wrong"
    ? value
    : null;
}

function parseRuntimeRun(value: unknown): ToeicRuntimeRun {
  if (
    !isRecord(value) ||
    !isString(value.sessionId) ||
    (value.scope !== "test" && value.scope !== "part_practice") ||
    (value.testKey !== null && !isString(value.testKey)) ||
    (value.partNumber !== null && !isNumber(value.partNumber)) ||
    (value.mode !== "practice" && value.mode !== "mock_test") ||
    !Array.isArray(value.selectedParts) ||
    value.selectedParts.some((part) => !isNumber(part)) ||
    !isNumber(value.correctCount) ||
    !isNumber(value.wrongCount) ||
    !isRecord(value.finish) ||
    (value.finish.status !== "open" &&
      value.finish.status !== "pending" &&
      value.finish.status !== "completed") ||
    !Array.isArray(value.answers)
  ) {
    invalidApiResponse();
  }

  const answers = value.answers.map((answer) => {
    const selectedKey = isRecord(answer) ? parseOptionKey(answer.selectedKey) : null;
    const status = isRecord(answer) ? parseAnswerStatus(answer.status) : null;

    if (
      !isRecord(answer) ||
      !isString(answer.questionKey) ||
      !selectedKey ||
      !status
    ) {
      invalidApiResponse();
    }

    return {
      questionKey: answer.questionKey,
      selectedKey,
      status,
    };
  });

  return {
    sessionId: value.sessionId,
    scope: value.scope,
    testKey: value.testKey,
    partNumber: value.partNumber,
    mode: value.mode,
    selectedParts: value.selectedParts,
    correctCount: value.correctCount,
    wrongCount: value.wrongCount,
    finish: { status: value.finish.status },
    answers,
  };
}

export function createRuntimePartPracticeRun(token: string, partNumber: number) {
  return apiRequest("/tests/runtime/part-practice-runs", {
    method: "POST",
    token,
    body: JSON.stringify({ partNumber }),
  }).then(parseRuntimeRun);
}

export function getRuntimeRun(token: string, sessionId: string) {
  return apiRequest(`/tests/runtime/runs/${sessionId}`, { token }).then(
    parseRuntimeRun,
  );
}

export function submitRuntimeAnswer(
  token: string,
  sessionId: string,
  payload: {
    questionKey: string;
    selectedKey: OptionKey;
    mode?: "review_wrong";
  },
) {
  return apiRequest(`/tests/runtime/runs/${sessionId}/answers`, {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  }).then((body) => {
    if (!isRecord(body) || typeof body.graded !== "boolean") {
      invalidApiResponse();
    }

    return { graded: body.graded };
  });
}

export function listRuntimePartPracticeRuns(token: string) {
  return apiRequest("/tests/runtime/part-practice-runs", { token }).then((body) => {
    if (!isRecord(body) || !Array.isArray(body.items)) {
      invalidApiResponse();
    }

    return body.items.map((item): ToeicRuntimePartPracticeSummary => {
      if (
        !isRecord(item) ||
        !isNumber(item.partNumber) ||
        !isNumber(item.answeredCount) ||
        !isNumber(item.correctCount) ||
        !isNumber(item.wrongCount)
      ) {
        invalidApiResponse();
      }

      return {
        partNumber: item.partNumber,
        answeredCount: item.answeredCount,
        correctCount: item.correctCount,
        wrongCount: item.wrongCount,
      };
    });
  });
}

export function clearRuntimePartPracticeRun(token: string, partNumber: number) {
  return apiRequest(`/tests/runtime/part-practice-runs/${partNumber}`, {
    method: "DELETE",
    token,
  });
}
