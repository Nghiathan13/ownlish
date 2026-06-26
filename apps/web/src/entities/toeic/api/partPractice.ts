import { apiRequest, invalidApiResponse } from "@/shared/api/http";
import { isNumber, isRecord } from "@/shared/lib/parse";
import { parsePartPracticeSession } from "./parsePartPracticeSession";
import { parseSubmitAnswerResult } from "./parseSubmitAnswerResult";
import type {
  ClearPartPracticeHistoryResult,
  CreatePartPracticeRunInput,
  PartPracticePartSummary,
  PracticeMode,
  SubmitAnswerResult,
} from "./types";
import { getPartPracticeRunApiPath } from "@/features/tests/shared/lib/partPracticePaths";

function parsePartPracticePartSummary(value: unknown): PartPracticePartSummary | null {
  if (!isRecord(value) || !isNumber(value.partNumber)) {
    return null;
  }

  if (
    !isNumber(value.total) ||
    !isNumber(value.answered) ||
    !isNumber(value.correct) ||
    !isNumber(value.wrong)
  ) {
    return null;
  }

  return {
    partNumber: value.partNumber,
    total: value.total,
    answered: value.answered,
    correct: value.correct,
    wrong: value.wrong,
  };
}

export function listPartPracticeSummaries(
  token: string,
  options: { signal?: AbortSignal } = {},
) {
  return apiRequest("/tests/part-practice/parts", {
    signal: options.signal,
    token,
  }).then((body) => {
    if (!isRecord(body) || !Array.isArray(body.items)) {
      invalidApiResponse();
    }

    return body.items
      .map(parsePartPracticePartSummary)
      .filter(
        (item): item is PartPracticePartSummary => item !== null,
      );
  });
}

export function createPartPracticeRun(
  token: string,
  input: CreatePartPracticeRunInput,
) {
  return apiRequest("/tests/part-practice/runs", {
    method: "POST",
    token,
    body: JSON.stringify({
      partNumber: input.partNumber,
      mode: input.mode,
    }),
  }).then(parsePartPracticeSession);
}

export function getPartPracticeRun(
  token: string,
  sessionId: string,
  options?: { mode?: PracticeMode },
) {
  return apiRequest(getPartPracticeRunApiPath(sessionId, options), {
    method: "GET",
    token,
  }).then(parsePartPracticeSession);
}

export async function submitPartPracticeAnswer(
  token: string,
  sessionId: string,
  payload: {
    toeicQuestionId: number;
    selectedKey: "A" | "B" | "C" | "D";
    mode?: PracticeMode;
  },
): Promise<SubmitAnswerResult> {
  const body = await apiRequest(`/tests/part-practice/runs/${sessionId}/answers`, {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });

  return parseSubmitAnswerResult(body);
}

export async function clearPartPracticeHistory(
  token: string,
  partNumber: number,
): Promise<ClearPartPracticeHistoryResult> {
  const body = await apiRequest(`/tests/part-practice/${partNumber}/history`, {
    method: "DELETE",
    token,
  });

  if (!isRecord(body) || !isNumber(body.resetRunCount)) {
    invalidApiResponse();
  }

  return { resetRunCount: body.resetRunCount };
}
