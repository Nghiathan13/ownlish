"use client";

import { createContext, useContext } from "react";
import type {
  CompleteEmailOtpProfileInput,
  EmailOtpVerification,
  GoogleLoginInput,
  LoginInput,
  RegisterInput,
  UpdateProfileInput,
  VerifyEmailOtpInput,
} from "@/entities/auth/@x/session";
import type { AuthUser } from "@/entities/auth/@x/session";
import type { AuthStatus } from "./authStatus";

export type AuthSessionContextValue = {
  clearSession: () => void;
  completeEmailOtpProfile: (input: CompleteEmailOtpProfileInput) => Promise<void>;
  googleLogin: (input: GoogleLoginInput) => Promise<void>;
  login: (input: LoginInput) => Promise<void>;
  logout: () => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  status: AuthStatus;
  updateProfile: (input: UpdateProfileInput) => Promise<void>;
  user: AuthUser | null;
  verifyEmailOtp: (input: VerifyEmailOtpInput) => Promise<EmailOtpVerification>;
};

export const AuthSessionContext =
  createContext<AuthSessionContextValue | null>(null);

export function useAuthSessionContext() {
  const context = useContext(AuthSessionContext);

  if (!context) {
    throw new Error("useAuthSession must be used within AuthProvider.");
  }

  return context;
}

/** Public alias used across the app (same as useAuthSessionContext). */
export const useAuthSession = useAuthSessionContext;
