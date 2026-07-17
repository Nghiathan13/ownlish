import { invalidApiResponse } from "@/shared/api/http";
import { isNullableString, isRecord, isString } from "@/shared/lib/parse";
import type { AuthResponse, AuthUser, UserRole } from "@/entities/auth/types";

function parseUserRole(value: unknown): UserRole {
  if (value === "USER" || value === "ADMIN") {
    return value;
  }

  invalidApiResponse();
}

export function parseAuthUser(body: unknown): AuthUser {
  if (!isRecord(body)) invalidApiResponse();

  const { id, email, name, avatarUrl, role } = body;

  if (
    !isString(id) ||
    !isString(email) ||
    !isNullableString(name) ||
    !isNullableString(avatarUrl)
  ) {
    invalidApiResponse();
  }

  return { id, email, name, avatarUrl, role: parseUserRole(role) };
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
