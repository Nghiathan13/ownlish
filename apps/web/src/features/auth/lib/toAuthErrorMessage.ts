import { ApiError } from "@/shared/api/http";

export function toAuthErrorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}
