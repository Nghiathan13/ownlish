import { apiRequest, invalidApiResponse } from "@/shared/api/http";
import {
  isNullableString,
  isNumber,
  isRecord,
} from "@/shared/lib/parse";
import {
  DEFAULT_TOEIC_YEAR,
  type ToeicYear,
} from "@/features/tests/shared/constants/toeicYears";
import { normalizeSelectedParts } from "@/features/tests/shared/lib/toeicParts";
import {
  getExpandToeicRunPartsApiPath,
  getToeicRunApiPath,
} from "@/features/tests/shared/lib/toeicRunPaths";
import { parseToeicRunResult } from "./parseToeicRunResult";
import { parseSubmitAnswerResult } from "./parseSubmitAnswerResult";
import type {
  ClearToeicPracticeHistoryResult,
  CreateToeicRunInput,
  FinishToeicRunResult,
  PracticeMode,
  RefreshMediaGroup,
  ToeicRunMode,
  ToeicTestSummary,
} from "./types";

function parseToeicPartProgress(value: unknown) {
  if (!isRecord(value) || !isNumber(value.partNumber)) {
    return null;
  }

  if (!isNumber(value.partCorrectCount) || !isNumber(value.partWrongCount)) {
    return null;
  }

  return {
    partNumber: value.partNumber,
    partCorrectCount: value.partCorrectCount,
    partWrongCount: value.partWrongCount,
  };
}

function parseTestSummary(value: unknown): ToeicTestSummary | null {
  if (!isRecord(value)) {
    return null;
  }

  if (
    !isNumber(value.id) ||
    !isNumber(value.year) ||
    !isNumber(value.testNumber) ||
    !Array.isArray(value.parts)
  ) {
    return null;
  }

  const parts = value.parts
    .map(parseToeicPartProgress)
    .filter(
      (part): part is NonNullable<ReturnType<typeof parseToeicPartProgress>> =>
        part !== null,
    );

  return {
    id: value.id,
    year: value.year,
    testNumber: value.testNumber,
    parts,
  };
}

function parseRefreshGroup(value: unknown): RefreshMediaGroup | null {
  if (!isRecord(value) || !isNumber(value.id)) {
    return null;
  }

  return {
    id: value.id,
    audioUrl: isNullableString(value.audioUrl) ? value.audioUrl : null,
    audioUrlExpiresAt: isNullableString(value.audioUrlExpiresAt)
      ? value.audioUrlExpiresAt
      : null,
    imageUrl: isNullableString(value.imageUrl) ? value.imageUrl : null,
    imageUrlExpiresAt: isNullableString(value.imageUrlExpiresAt)
      ? value.imageUrlExpiresAt
      : null,
  };
}

export function listToeicTests(
  token: string,
  year: ToeicYear = DEFAULT_TOEIC_YEAR,
  options: { signal?: AbortSignal } = {},
) {
  return apiRequest(`/tests?year=${year}`, {
    signal: options.signal,
    token,
  }).then((body) => {
    if (!isRecord(body) || !Array.isArray(body.items)) {
      invalidApiResponse();
    }

    return body.items
      .map(parseTestSummary)
      .filter((item): item is ToeicTestSummary => item !== null);
  });
}

export function listToeicTestYears(
  token: string,
  options: { signal?: AbortSignal } = {},
) {
  return apiRequest("/tests/years", {
    signal: options.signal,
    token,
  }).then((body) => {
    if (!isRecord(body) || !Array.isArray(body.years)) {
      invalidApiResponse();
    }

    return body.years.filter(
      (year): year is number => isNumber(year) && Number.isInteger(year),
    );
  });
}

export function createToeicRun(token: string, input: CreateToeicRunInput) {
  return apiRequest("/tests/runs", {
    method: "POST",
    token,
    body: JSON.stringify({
      testId: input.testId,
      partNumbers: normalizeSelectedParts(input.partNumbers),
      mode: input.mode,
    }),
  }).then(parseToeicRunResult);
}

type GetToeicRunOptions = {
  mode?: PracticeMode;
  parts?: number[];
};

export function getToeicRun(
  token: string,
  sessionId: string,
  options?: GetToeicRunOptions,
) {
  return apiRequest(getToeicRunApiPath(sessionId, options), {
    method: "GET",
    token,
  }).then(parseToeicRunResult);
}

export function expandToeicRunParts(
  token: string,
  sessionId: string,
  parts: number[],
) {
  return apiRequest(getExpandToeicRunPartsApiPath(sessionId), {
    method: "POST",
    token,
    body: JSON.stringify({
      partNumbers: normalizeSelectedParts(parts),
    }),
  }).then(parseToeicRunResult);
}

export async function submitToeicAnswer(
  token: string,
  sessionId: string,
  payload: {
    toeicQuestionId: number;
    selectedKey: "A" | "B" | "C" | "D";
    mode?: ToeicRunMode;
  },
) {
  const body = await apiRequest(`/tests/runs/${sessionId}/answers`, {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });

  return parseSubmitAnswerResult(body);
}

export async function finishToeicRun(token: string, sessionId: string) {
  const body = await apiRequest(`/tests/runs/${sessionId}/finish`, {
    method: "PATCH",
    token,
  });

  if (
    !isRecord(body) ||
    (body.status !== "accepted" && body.status !== "completed")
  ) {
    invalidApiResponse();
  }

  return { status: body.status } satisfies FinishToeicRunResult;
}

export async function refreshToeicPartMedia(
  token: string,
  testId: number,
  partNumber: number,
  groupIds?: number[],
) {
  const body = await apiRequest(
    `/tests/${testId}/parts/${partNumber}/refresh-media`,
    {
      method: "POST",
      token,
      body: JSON.stringify(groupIds?.length ? { groupIds } : {}),
    },
  );

  if (!isRecord(body) || !Array.isArray(body.groups)) {
    invalidApiResponse();
  }

  return body.groups
    .map(parseRefreshGroup)
    .filter((group): group is RefreshMediaGroup => group !== null);
}

export async function clearToeicPracticeHistory(
  token: string,
  testId: number,
): Promise<ClearToeicPracticeHistoryResult> {
  const body = await apiRequest(`/tests/${testId}/practice-history`, {
    method: "DELETE",
    token,
  });

  if (!isRecord(body) || !isNumber(body.deletedSessionCount)) {
    invalidApiResponse();
  }

  return { deletedSessionCount: body.deletedSessionCount };
}
