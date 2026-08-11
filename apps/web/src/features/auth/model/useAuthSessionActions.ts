"use client";

import {
  type Dispatch,
  type MutableRefObject,
  type SetStateAction,
  useCallback,
  useMemo,
} from "react";
import {
  completeEmailOtpProfile as completeEmailOtpProfileRequest,
  googleLogin as googleLoginRequest,
  login as loginRequest,
  logoutSession,
  register as registerRequest,
  verifyEmailOtp as verifyEmailOtpRequest,
  type CompleteEmailOtpProfileInput,
  type EmailOtpProfileRequired,
  type EmailOtpVerification,
  type GoogleLoginInput,
  type LoginInput,
  type RegisterInput,
  type UpdateProfileInput,
  type VerifyEmailOtpInput,
  updateProfile as updateProfileRequest,
} from "@/entities/auth/api/auth";
import type { AuthUser } from "@/entities/auth/types";
import {
  clearClientSession,
  establishSession,
} from "@/entities/session/model/accessTokenManager";
import { runAuthenticatedRequest } from "@/entities/session/model/authenticatedRequest";
import type { AuthStatus } from "../lib/authStatus";
import type { AuthSessionMessage } from "../lib/authSessionChannel";

type UseAuthSessionActionsOptions = {
  sessionChannelRef: MutableRefObject<BroadcastChannel | null>;
  setStatus: Dispatch<SetStateAction<AuthStatus>>;
  setUser: Dispatch<SetStateAction<AuthUser | null>>;
};

export function useAuthSessionActions({
  sessionChannelRef,
  setStatus,
  setUser,
}: UseAuthSessionActionsOptions) {
  const notifyOtherTabs = useCallback((message: AuthSessionMessage) => {
    sessionChannelRef.current?.postMessage(message);
  }, [sessionChannelRef]);

  const clearSession = useCallback(() => {
    clearClientSession();
  }, []);

  const establishAuthenticatedSession = useCallback(
    (response: { accessToken: string; user: AuthUser }) => {
      establishSession({ accessToken: response.accessToken });
      setUser(response.user);
      setStatus("authenticated");
      notifyOtherTabs({ type: "session-changed" });
    },
    [notifyOtherTabs, setStatus, setUser],
  );

  const login = useCallback(
    async (input: LoginInput) => {
      const response = await loginRequest(input);
      establishAuthenticatedSession(response);
    },
    [establishAuthenticatedSession],
  );

  const register = useCallback(
    async (input: RegisterInput) => {
      const response = await registerRequest(input);
      establishAuthenticatedSession(response);
    },
    [establishAuthenticatedSession],
  );

  const googleLogin = useCallback(
    async (input: GoogleLoginInput) => {
      const response = await googleLoginRequest(input);
      establishAuthenticatedSession(response);
    },
    [establishAuthenticatedSession],
  );

  const verifyEmailOtp = useCallback(
    async (input: VerifyEmailOtpInput): Promise<EmailOtpVerification> => {
      const response = await verifyEmailOtpRequest(input);

      if ("status" in response) {
        return response as EmailOtpProfileRequired;
      }

      establishAuthenticatedSession(response);
      return response;
    },
    [establishAuthenticatedSession],
  );

  const completeEmailOtpProfile = useCallback(
    async (input: CompleteEmailOtpProfileInput) => {
      const response = await completeEmailOtpProfileRequest(input);
      establishAuthenticatedSession(response);
    },
    [establishAuthenticatedSession],
  );

  const logout = useCallback(async () => {
    clearSession();
    setUser(null);
    setStatus("guest");
    notifyOtherTabs({ type: "session-signed-out" });
    await logoutSession().catch(() => undefined);
  }, [clearSession, notifyOtherTabs, setStatus, setUser]);

  const updateProfile = useCallback(
    async (input: UpdateProfileInput) => {
      const updatedUser = await runAuthenticatedRequest({
        request: (accessToken) => updateProfileRequest(accessToken, input),
      });

      setUser(updatedUser);
      notifyOtherTabs({ type: "session-changed" });
    },
    [notifyOtherTabs, setUser],
  );

  return useMemo(
    () => ({
      clearSession,
      completeEmailOtpProfile,
      googleLogin,
      login,
      logout,
      register,
      updateProfile,
      verifyEmailOtp,
    }),
    [
      clearSession,
      completeEmailOtpProfile,
      googleLogin,
      login,
      logout,
      register,
      updateProfile,
      verifyEmailOtp,
    ],
  );
}
