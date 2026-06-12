import { apiRequest, invalidApiResponse } from "@/shared/api/http";
import { isNullableString, isRecord, isString } from "@/shared/lib/parse";

export type AuthUser = {
  id: string;
  email: string;
  name: string | null;
};

export type AuthResponse = {
  accessToken: string;
  user: AuthUser;
};

export type LoginInput = {
  email: string;
  password: string;
};

export type RegisterInput = LoginInput & {
  name?: string;
};

function parseAuthUser(body: unknown): AuthUser {
  if (!isRecord(body)) invalidApiResponse();

  const { id, email, name } = body;

  if (!isString(id) || !isString(email) || !isNullableString(name)) {
    invalidApiResponse();
  }

  return { id, email, name };
}

function parseAuthResponse(body: unknown): AuthResponse {
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

export function refreshSession() {
  return apiRequest("/auth/refresh", {
    method: "POST",
  }).then(parseAuthResponse);
}

export function logoutSession() {
  return apiRequest("/auth/logout", {
    method: "POST",
  }).then(parseLogoutResponse);
}
