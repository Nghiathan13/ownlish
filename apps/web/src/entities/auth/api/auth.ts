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
  CompleteEmailOtpProfileInput,
  EmailOtpRequestInput,
  EmailOtpRequestResponse,
  EmailOtpVerification,
  GoogleLoginInput,
  LoginInput,
  RegisterInput,
  UpdateProfileInput,
  VerifyEmailOtpInput,
} from "@/entities/auth/types";

export type {
  AuthResponse,
  AuthUser,
  CompleteEmailOtpProfileInput,
  EmailOtpProfileRequired,
  EmailOtpRequestInput,
  EmailOtpRequestResponse,
  EmailOtpVerification,
  GoogleLoginInput,
  LoginInput,
  RegisterInput,
  UpdateProfileInput,
  VerifyEmailOtpInput,
} from "@/entities/auth/types";

function parseLogoutResponse(body: unknown): { success: true } {
  if (!isRecord(body) || body.success !== true) {
    invalidApiResponse();
  }

  return { success: true };
}

function parseEmailOtpRequestResponse(body: unknown): EmailOtpRequestResponse {
  if (
    !isRecord(body) ||
    typeof body.challengeId !== "string" ||
    typeof body.resendAvailableAt !== "string"
  ) {
    invalidApiResponse();
  }

  return {
    challengeId: body.challengeId,
    resendAvailableAt: body.resendAvailableAt,
  };
}

function parseEmailOtpVerification(body: unknown): EmailOtpVerification {
  if (
    isRecord(body) &&
    body.status === "profile_required" &&
    typeof body.enrollmentToken === "string"
  ) {
    return {
      enrollmentToken: body.enrollmentToken,
      status: "profile_required",
    };
  }

  return parseAuthResponse(body);
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

export function requestEmailOtp(input: EmailOtpRequestInput) {
  return apiRequest("/api/auth/email-otp/request", {
    method: "POST",
    body: JSON.stringify(input),
    sameOrigin: true,
  }).then(parseEmailOtpRequestResponse);
}

export function verifyEmailOtp(input: VerifyEmailOtpInput) {
  return apiRequest("/api/auth/email-otp/verify", {
    method: "POST",
    body: JSON.stringify(input),
    sameOrigin: true,
  }).then(parseEmailOtpVerification);
}

export function completeEmailOtpProfile(input: CompleteEmailOtpProfileInput) {
  return apiRequest("/api/auth/email-otp/complete-profile", {
    method: "POST",
    body: JSON.stringify(input),
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
