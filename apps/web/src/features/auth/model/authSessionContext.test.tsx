import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import {
  AuthSessionContext,
  useAuthSession,
  useAuthSessionContext,
  type AuthSessionContextValue,
} from "./authSessionContext";

const sessionValue = {
  clearSession: () => undefined,
  completeEmailOtpProfile: async () => undefined,
  googleLogin: async () => undefined,
  login: async () => undefined,
  logout: async () => undefined,
  register: async () => undefined,
  status: "authenticated" as const,
  updateProfile: async () => undefined,
  user: {
    id: "user-1",
    email: "user@example.com",
    name: "User",
    avatarUrl: null,
    role: "USER" as const,
  },
  verifyEmailOtp: async () => ({
    accessToken: "token",
    user: {
      id: "user-1",
      email: "user@example.com",
      name: "User",
      avatarUrl: null,
      role: "USER" as const,
    },
  }),
} satisfies AuthSessionContextValue;

function wrapper({ children }: { children: ReactNode }) {
  return (
    <AuthSessionContext.Provider value={sessionValue}>
      {children}
    </AuthSessionContext.Provider>
  );
}

describe("authSessionContext", () => {
  it("throws when the session hook is used outside a provider", () => {
    expect(() => renderHook(() => useAuthSessionContext())).toThrow(
      "useAuthSession must be used within AuthProvider.",
    );
  });

  it("returns the provider value and aliases useAuthSession", () => {
    const context = renderHook(() => useAuthSessionContext(), { wrapper });
    const alias = renderHook(() => useAuthSession(), { wrapper });

    expect(context.result.current).toBe(sessionValue);
    expect(alias.result.current).toBe(sessionValue);
    expect(useAuthSession).toBe(useAuthSessionContext);
  });
});
