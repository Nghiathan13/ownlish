import { ApiError } from "@/shared/api";

export function toAuthErrorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}
