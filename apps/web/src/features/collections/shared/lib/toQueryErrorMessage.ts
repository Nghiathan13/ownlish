import { ApiError } from "@/shared/api/http";

export function toQueryErrorMessage(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message : error ? fallback : null;
}
