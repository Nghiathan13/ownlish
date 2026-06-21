import { apiRequest, invalidApiResponse } from "@/shared/api/http";
import {
  parseAuthResponse,
  parseAuthUser,
} from "@/entities/auth/lib/parseAuthResponse";
import { isRecord } from "@/shared/lib/parse";
import type { LoginInput, RegisterInput } from "@/entities/auth/types";

export type { AuthResponse, AuthUser, LoginInput, RegisterInput } from "@/entities/auth/types";

function parseLogoutResponse(body: unknown): { success: true } {
  if (!isRecord(body) || body.success !== true) {
    invalidApiResponse();
  }

  return { success: true };
}

export function login(input: LoginInput) {
  return apiRequest("/auth/login", {
    method: "POST",
    body: JSON.stringify(input),
  }).then(parseAuthResponse);
}

export function register(input: RegisterInput) {
  return apiRequest("/auth/register", {
    method: "POST",
    body: JSON.stringify(input),
  }).then(parseAuthResponse);
}

export function getCurrentUser(token: string) {
  return apiRequest("/auth/me", {
    token,
  }).then(parseAuthUser);
}

export function logoutSession() {
  return apiRequest("/auth/logout", {
    method: "POST",
  }).then(parseLogoutResponse);
}
