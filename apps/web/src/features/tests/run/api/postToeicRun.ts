import { apiRequest } from "@/shared/api/http";

export type PostToeicRunPayload = {
  testId: number;
  partNumbers: number[];
  mode?: "practice" | "review_wrong" | "mock_test";
};

export function postToeicRun(
  token: string,
  payload: PostToeicRunPayload,
) {
  return apiRequest("/tests/runs", {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}
