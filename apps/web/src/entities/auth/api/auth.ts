import {
  apiFormRequest,
  apiRequest,
  invalidApiResponse,
} from "@/shared/api/http";
import {
  parseAuthResponse,
  parseAuthUser,
} from "@/entities/auth/lib/parseAuthResponse";
import { isRecord } from "@/shared/lib/parse";
import type {
  GoogleLoginInput,
  LoginInput,
  RegisterInput,
  UpdateProfileInput,
} from "@/entities/auth/types";

export type {
  AuthResponse,
  AuthUser,
  GoogleLoginInput,
  LoginInput,
  RegisterInput,
  UpdateProfileInput,
} from "@/entities/auth/types";

function parseLogoutResponse(body: unknown): { success: true } {
  if (!isRecord(body) || body.success !== true) {
    invalidApiResponse();
  }

  return { success: true };
}

export function login(input: LoginInput) {
  return apiRequest("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(input),
    sameOrigin: true,
  }).then(parseAuthResponse);
}

export function register(input: RegisterInput) {
  return apiRequest("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(input),
    sameOrigin: true,
  }).then(parseAuthResponse);
}

export function googleLogin(input: GoogleLoginInput) {
  return apiRequest("/api/auth/google", {
    method: "POST",
    body: JSON.stringify(input),
    headers: {
      "X-Requested-With": "XMLHttpRequest",
    },
    sameOrigin: true,
  }).then(parseAuthResponse);
}

export function getCurrentUser(token: string) {
  return apiRequest("/auth/me", {
    token,
  }).then(parseAuthUser);
}

export function logoutSession() {
  return apiRequest("/api/auth/logout", {
    method: "POST",
    sameOrigin: true,
  }).then(parseLogoutResponse);
}

export function updateProfile(token: string, input: UpdateProfileInput) {
  const body = new FormData();
  body.set("name", input.name);

  if (input.avatar) {
    body.set("avatar", input.avatar);
  }

  return apiFormRequest("/auth/profile", {
    token,
    method: "PATCH",
    body,
  }).then(parseAuthUser);
}
