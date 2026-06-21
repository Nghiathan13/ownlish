import { invalidApiResponse } from "@/shared/api/http";
import { isNullableString, isRecord, isString } from "@/shared/lib/parse";
import type { AuthResponse, AuthUser } from "@/entities/auth/types";

export function parseAuthUser(body: unknown): AuthUser {
  if (!isRecord(body)) invalidApiResponse();

  const { id, email, name } = body;

  if (!isString(id) || !isString(email) || !isNullableString(name)) {
    invalidApiResponse();
  }

  return { id, email, name };
}

export function parseAuthResponse(body: unknown): AuthResponse {
  if (!isRecord(body)) invalidApiResponse();

  const { accessToken, user } = body;

  if (!isString(accessToken)) {
    invalidApiResponse();
  }

  return {
    accessToken,
    user: parseAuthUser(user),
  };
}
