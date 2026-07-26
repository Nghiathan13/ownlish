import { apiRequest, invalidApiResponse } from "@/shared/api/http";
import { isNumber, isRecord, isString } from "@/shared/lib/parse";
import type {
  RuntimeAnswerStatus,
  ToeicRuntimeMockHistoryItem,
  ToeicRuntimeMockRunPreparation,
  ToeicRuntimePartPracticeSummary,
  ToeicRuntimeRun,
  ToeicRuntimeTestPracticeSummary,
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
    (value.timer !== undefined && value.timer !== null && !isRecord(value.timer)) ||
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

  const timer =
    value.timer === undefined || value.timer === null
      ? null
      : isNumber(value.timer.timeLimitSeconds) &&
          isNumber(value.timer.remainingSeconds)
        ? {
            timeLimitSeconds: value.timer.timeLimitSeconds,
            remainingSeconds: value.timer.remainingSeconds,
          }
        : invalidApiResponse();

  return {
    sessionId: value.sessionId,
    scope: value.scope,
    testKey: value.testKey,
    partNumber: value.partNumber,
    mode: value.mode,
    selectedParts: value.selectedParts,
    correctCount: value.correctCount,
    wrongCount: value.wrongCount,
    timer,
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

export function createRuntimeTestRun(
  token: string,
  input: {
    testKey: string;
    partNumbers: number[];
    mode: "practice" | "mock_test";
    timeLimitMinutes?: number;
  },
) {
  return apiRequest("/tests/runtime/test-runs", {
    method: "POST",
    token,
    body: JSON.stringify(input),
  }).then(parseRuntimeRun);
}

function parseMockRunPreparation(value: unknown): ToeicRuntimeMockRunPreparation {
  if (!isRecord(value) || !isString(value.status)) {
    invalidApiResponse();
  }

  if (value.status === "available") {
    return { status: "available" };
  }

  if (
    (value.status !== "open" && value.status !== "pending") ||
    !isRecord(value.run) ||
    !isString(value.run.sessionId) ||
    !Array.isArray(value.run.selectedParts) ||
    value.run.selectedParts.some((part) => !isNumber(part))
  ) {
    invalidApiResponse();
  }

  return {
    status: value.status,
    run: {
      sessionId: value.run.sessionId,
      selectedParts: value.run.selectedParts,
    },
  };
}

export function prepareRuntimeMockRun(
  token: string,
  input: { testKey: string; partNumbers: number[] },
) {
  return apiRequest("/tests/runtime/mock-runs/prepare", {
    method: "POST",
    token,
    body: JSON.stringify(input),
  }).then(parseMockRunPreparation);
}

export function restartRuntimeMockRun(
  token: string,
  input: { testKey: string; partNumbers: number[]; timeLimitMinutes?: number },
) {
  return apiRequest("/tests/runtime/mock-runs/restart", {
    method: "POST",
    token,
    body: JSON.stringify(input),
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
    remainingSeconds?: number;
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

export function updateRuntimeMockTimer(
  token: string,
  sessionId: string,
  remainingSeconds: number,
  options: { keepalive?: boolean } = {},
) {
  return apiRequest(`/tests/runtime/runs/${sessionId}/timer`, {
    method: "PATCH",
    token,
    keepalive: options.keepalive,
    body: JSON.stringify({ remainingSeconds }),
  }).then((body) => {
    if (!isRecord(body) || !isNumber(body.remainingSeconds)) {
      invalidApiResponse();
    }

    return { remainingSeconds: body.remainingSeconds };
  });
}

export function finishRuntimeMockRun(token: string, sessionId: string) {
  return apiRequest(`/tests/runtime/runs/${sessionId}/finish`, {
    method: "PATCH",
    token,
  }).then((body) => {
    if (!isRecord(body) || (body.status !== "accepted" && body.status !== "completed")) {
      invalidApiResponse();
    }

    return { status: body.status };
  });
}

export function listRuntimeTestPracticeRuns(token: string) {
  return apiRequest("/tests/runtime/test-practice-runs", { token }).then((body) => {
    if (!isRecord(body) || !Array.isArray(body.items)) {
      invalidApiResponse();
    }

    return body.items.map((item): ToeicRuntimeTestPracticeSummary => {
      if (
        !isRecord(item) ||
        !isString(item.testKey) ||
        !isNumber(item.answeredCount) ||
        !isNumber(item.correctCount) ||
        !isNumber(item.wrongCount) ||
        !Array.isArray(item.parts)
      ) {
        invalidApiResponse();
      }

      const parts = item.parts.map((part) => {
        if (
          !isRecord(part) ||
          !isNumber(part.partNumber) ||
          !isNumber(part.correctCount) ||
          !isNumber(part.wrongCount)
        ) {
          invalidApiResponse();
        }

        return {
          partNumber: part.partNumber,
          correctCount: part.correctCount,
          wrongCount: part.wrongCount,
        };
      });

      return {
        testKey: item.testKey,
        answeredCount: item.answeredCount,
        correctCount: item.correctCount,
        wrongCount: item.wrongCount,
        parts,
      };
    });
  });
}

export function listRuntimeMockRuns(token: string, testKey: string) {
  return apiRequest(`/tests/runtime/mock-runs/${testKey}`, { token }).then((body) => {
    if (!isRecord(body) || !Array.isArray(body.items)) {
      invalidApiResponse();
    }

    return body.items.map((item): ToeicRuntimeMockHistoryItem => {
      if (
        !isRecord(item) ||
        !isString(item.sessionId) ||
        !Array.isArray(item.selectedParts) ||
        item.selectedParts.some((part) => !isNumber(part)) ||
        !isString(item.status)
      ) {
        invalidApiResponse();
      }

      if (item.status === "open" || item.status === "pending") {
        return {
          sessionId: item.sessionId,
          selectedParts: item.selectedParts,
          status: item.status,
        };
      }

      if (item.status !== "completed") {
        invalidApiResponse();
      }

      if (
        !isNumber(item.correctCount) ||
        !isNumber(item.wrongCount) ||
        !isRecord(item.score) ||
        !isNumber(item.score.listening) ||
        !isNumber(item.score.reading) ||
        !isNumber(item.score.total)
      ) {
        invalidApiResponse();
      }

      return {
        sessionId: item.sessionId,
        selectedParts: item.selectedParts,
        status: "completed",
        correctCount: item.correctCount,
        wrongCount: item.wrongCount,
        score: {
          listening: item.score.listening,
          reading: item.score.reading,
          total: item.score.total,
        },
      };
    });
  });
}

export function clearRuntimeTestPracticeRun(token: string, testKey: string) {
  return apiRequest(`/tests/runtime/test-practice-runs/${testKey}`, {
    method: "DELETE",
    token,
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
