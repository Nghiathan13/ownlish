import { invalidApiResponse } from "@/shared/api/http";
import { isNumber, isRecord } from "@/shared/lib/parse";
import type {
  AdminToeicTestListItem,
  AdminToeicTestListResponse,
  AdminToeicTestPartSummary,
} from "@/features/admin/toeic/api/types";

function parsePartSummary(body: unknown): AdminToeicTestPartSummary {
  if (!isRecord(body)) invalidApiResponse();

  const { partNumber, groupCount, questionCount } = body;

  if (
    !isNumber(partNumber) ||
    !isNumber(groupCount) ||
    !isNumber(questionCount)
  ) {
    invalidApiResponse();
  }

  return { partNumber, groupCount, questionCount };
}

function parseListItem(body: unknown): AdminToeicTestListItem {
  if (!isRecord(body)) invalidApiResponse();

  const { id, year, testNumber, parts } = body;

  if (!isNumber(id) || !isNumber(year) || !isNumber(testNumber)) {
    invalidApiResponse();
  }

  if (!Array.isArray(parts)) {
    invalidApiResponse();
  }

  return {
    id,
    year,
    testNumber,
    parts: parts.map(parsePartSummary),
  };
}

export function parseAdminToeicTestListResponse(
  body: unknown,
): AdminToeicTestListResponse {
  if (!isRecord(body) || !Array.isArray(body.items)) {
    invalidApiResponse();
  }

  return {
    items: body.items.map(parseListItem),
  };
}
