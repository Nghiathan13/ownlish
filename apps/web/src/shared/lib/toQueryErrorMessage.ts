import { ApiError } from "@/shared/api/http";

export function toQueryErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError) {
    return error.message;
  }

  return error ? fallback : null;
}
