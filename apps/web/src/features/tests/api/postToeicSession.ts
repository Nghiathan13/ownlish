import { apiRequest } from "@/shared/api/http";

export type PostToeicSessionPayload = {
  testId: number;
  partNumbers: number[];
  mode?: "practice" | "review_wrong";
};

export function postToeicSession(
  token: string,
  payload: PostToeicSessionPayload,
) {
  return apiRequest("/tests/practice/sessions", {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}
