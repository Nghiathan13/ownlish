import { apiRequest } from "@/shared/api/http";
import { parseAdminToeicTestListResponse } from "@/features/admin/toeic/lib/parseAdminToeicTests";
import { parseAdminToeicTestRawResponse } from "@/features/admin/toeic/lib/parseAdminToeicTestRaw";
import type {
  AdminToeicTestListResponse,
  AdminToeicTestRawResponse,
} from "./types";

type ListAdminToeicTestsParams = {
  token: string;
  signal?: AbortSignal;
};

type GetAdminToeicTestRawParams = {
  token: string;
  testId: number;
  signal?: AbortSignal;
};

export function listAdminToeicTests({
  token,
  signal,
}: ListAdminToeicTestsParams): Promise<AdminToeicTestListResponse> {
  return apiRequest("/admin/tests", { token, signal }).then(
    parseAdminToeicTestListResponse,
  );
}

export function getAdminToeicTestRaw({
  token,
  testId,
  signal,
}: GetAdminToeicTestRawParams): Promise<AdminToeicTestRawResponse> {
  return apiRequest(`/admin/tests/${testId}/raw`, { token, signal }).then(
    parseAdminToeicTestRawResponse,
  );
}
