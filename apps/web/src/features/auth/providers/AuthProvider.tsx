"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  googleLogin as googleLoginRequest,
  login as loginRequest,
  logoutSession,
  register as registerRequest,
  type GoogleLoginInput,
  type LoginInput,
  type RegisterInput,
} from "@/entities/auth/api/auth";
import type { AuthUser } from "@/entities/auth/types";
import {
  clearClientSession,
  bootstrapClientSession,
  establishSession,
  discardClientAccessToken,
  setSessionInvalidHandler,
} from "@/entities/session/model/accessTokenManager";
import { isUnauthorizedError } from "@/shared/api/http";
import type { AuthStatus } from "@/features/auth/lib/authStatus";

export type { AuthStatus } from "@/features/auth/lib/authStatus";

type AuthSessionContextValue = {
  clearSession: () => void;
  googleLogin: (input: GoogleLoginInput) => Promise<void>;
  login: (input: LoginInput) => Promise<void>;
  logout: () => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  status: AuthStatus;
  user: AuthUser | null;
};

const AuthSessionContext = createContext<AuthSessionContextValue | null>(null);
const BOOTSTRAP_RETRY_DELAY_MS = 1_000;
const AUTH_SESSION_CHANNEL_NAME = "engvocab-auth";

type AuthSessionMessage =
  | { type: "session-changed" }
  | { type: "session-signed-out" };

function isAuthSessionMessage(value: unknown): value is AuthSessionMessage {
  return (
    typeof value === "object" &&
    value !== null &&
    "type" in value &&
    (value.type === "session-changed" || value.type === "session-signed-out")
  );
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<AuthUser | null>(null);
  const sessionChannelRef = useRef<BroadcastChannel | null>(null);

  const notifyOtherTabs = useCallback((message: AuthSessionMessage) => {
    sessionChannelRef.current?.postMessage(message);
  }, []);

  const clearSession = useCallback(() => {
    clearClientSession();
  }, []);

  useEffect(() => {
    setSessionInvalidHandler(() => {
      setUser(null);
      setStatus("guest");
    });

    return () => {
      setSessionInvalidHandler(null);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    let retryTimer: number | null = null;
    let syncVersion = 0;

    function clearRetryTimer() {
      if (retryTimer) {
        window.clearTimeout(retryTimer);
        retryTimer = null;
      }
    }

    async function bootstrapSession(version: number) {
      try {
        const session = await bootstrapClientSession();

        if (!cancelled && version === syncVersion) {
          setUser(session.user);
          setStatus("authenticated");
        }
      } catch (error) {
        if (!cancelled && version === syncVersion) {
          if (isUnauthorizedError(error)) {
            clearClientSession();
          } else {
            retryTimer = window.setTimeout(() => {
              void bootstrapSession(version);
            }, BOOTSTRAP_RETRY_DELAY_MS);
          }
        }
      }
    }

    function synchronizeSession() {
      syncVersion += 1;
      clearRetryTimer();
      discardClientAccessToken();
      setUser(null);
      setStatus("loading");
      void bootstrapSession(syncVersion);
    }

    function synchronizeSignedOutSession() {
      syncVersion += 1;
      clearRetryTimer();
      discardClientAccessToken();
      setUser(null);
      setStatus("guest");
    }

    const channel =
      typeof BroadcastChannel === "undefined"
        ? null
        : new BroadcastChannel(AUTH_SESSION_CHANNEL_NAME);

    if (channel) {
      const handleMessage = (event: MessageEvent<unknown>) => {
        if (!isAuthSessionMessage(event.data)) {
          return;
        }

        if (event.data.type === "session-changed") {
          synchronizeSession();
          return;
        }

        synchronizeSignedOutSession();
      };

      channel.addEventListener("message", handleMessage);
      sessionChannelRef.current = channel;

      void bootstrapSession(syncVersion);

      return () => {
        cancelled = true;
        clearRetryTimer();
        channel.removeEventListener("message", handleMessage);
        channel.close();
        if (sessionChannelRef.current === channel) {
          sessionChannelRef.current = null;
        }
      };
    }

    void bootstrapSession(syncVersion);

    return () => {
      cancelled = true;
      clearRetryTimer();
    };
  }, []);

  const login = useCallback(async (input: LoginInput) => {
    const response = await loginRequest(input);
    establishSession({ accessToken: response.accessToken });
    setUser(response.user);
    setStatus("authenticated");
    notifyOtherTabs({ type: "session-changed" });
  }, [notifyOtherTabs]);

  const register = useCallback(async (input: RegisterInput) => {
    const response = await registerRequest(input);
    establishSession({ accessToken: response.accessToken });
    setUser(response.user);
    setStatus("authenticated");
    notifyOtherTabs({ type: "session-changed" });
  }, [notifyOtherTabs]);

  const googleLogin = useCallback(async (input: GoogleLoginInput) => {
    const response = await googleLoginRequest(input);
    establishSession({ accessToken: response.accessToken });
    setUser(response.user);
    setStatus("authenticated");
    notifyOtherTabs({ type: "session-changed" });
  }, [notifyOtherTabs]);

  const logout = useCallback(async () => {
    await logoutSession().catch(() => undefined);
    clearSession();
    setUser(null);
    setStatus("guest");
    notifyOtherTabs({ type: "session-signed-out" });
  }, [clearSession, notifyOtherTabs]);

  const value = useMemo<AuthSessionContextValue>(
    () => ({
      clearSession,
      googleLogin,
      login,
      logout,
      register,
      status,
      user,
    }),
    [clearSession, googleLogin, login, logout, register, status, user],
  );

  return (
    <AuthSessionContext.Provider value={value}>
      {children}
    </AuthSessionContext.Provider>
  );
}

export function useAuthSessionContext() {
  const context = useContext(AuthSessionContext);

  if (!context) {
    throw new Error("useAuthSession must be used within AuthProvider.");
  }

  return context;
}
