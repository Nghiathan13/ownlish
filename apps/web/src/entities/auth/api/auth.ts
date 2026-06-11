import { ApiError, apiRequest } from "@/shared/api/http";
import { isNullableString, isRecord, isString } from "@/shared/lib/parse";

export type AuthUser = {
  id: string;
  email: string;
  name: string | null;
};

export type AuthResponse = {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
};

export type LoginInput = {
  email: string;
  password: string;
};

export type RegisterInput = LoginInput & {
  name?: string;
};

export type RefreshTokenInput = {
  refreshToken: string;
};

function invalidResponse(): never {
  throw new ApiError("Invalid server response.", 0);
}

function parseAuthUser(body: unknown): AuthUser {
  if (!isRecord(body)) invalidResponse();

  const { id, email, name } = body;

  if (!isString(id) || !isString(email) || !isNullableString(name)) {
    invalidResponse();
  }

  return { id, email, name };
}

function parseAuthResponse(body: unknown): AuthResponse {
  if (!isRecord(body)) invalidResponse();

  const { accessToken, refreshToken, user } = body;

  if (!isString(accessToken) || !isString(refreshToken)) {
    invalidResponse();
  }

  return {
    accessToken,
    refreshToken,
    user: parseAuthUser(user),
  };
}

function parseLogoutResponse(body: unknown): { success: true } {
  if (!isRecord(body) || body.success !== true) {
    invalidResponse();
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

export function refreshSession(input: RefreshTokenInput) {
  return apiRequest("/auth/refresh", {
    method: "POST",
    body: JSON.stringify(input),
  }).then(parseAuthResponse);
}

export function logoutSession(input: RefreshTokenInput) {
  return apiRequest("/auth/logout", {
    method: "POST",
    body: JSON.stringify(input),
  }).then(parseLogoutResponse);
}
