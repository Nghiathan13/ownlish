"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  login as loginRequest,
  logoutSession,
  register as registerRequest,
  type LoginInput,
  type RegisterInput,
} from "@/entities/auth/api/auth";
import type { AuthUser } from "@/entities/auth/types";
import {
  clearClientSession,
  bootstrapClientSession,
  establishSession,
  setSessionInvalidHandler,
} from "@/entities/session/model/accessTokenManager";
import { isUnauthorizedError } from "@/shared/api/http";
import type { AuthStatus } from "@/features/auth/lib/authStatus";

export type { AuthStatus } from "@/features/auth/lib/authStatus";

type AuthSessionContextValue = {
  clearSession: () => void;
  login: (input: LoginInput) => Promise<void>;
  logout: () => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  status: AuthStatus;
  user: AuthUser | null;
};

const AuthSessionContext = createContext<AuthSessionContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<AuthUser | null>(null);

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

    async function bootstrapSession() {
      try {
        const session = await bootstrapClientSession();

        if (!cancelled) {
          setUser(session.user);
          setStatus("authenticated");
        }
      } catch (error) {
        if (!cancelled) {
          if (isUnauthorizedError(error)) {
            clearClientSession();
          } else {
            setStatus("guest");
          }
        }
      }
    }

    void bootstrapSession();

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (input: LoginInput) => {
    const response = await loginRequest(input);
    establishSession({ accessToken: response.accessToken });
    setUser(response.user);
    setStatus("authenticated");
  }, []);

  const register = useCallback(async (input: RegisterInput) => {
    const response = await registerRequest(input);
    establishSession({ accessToken: response.accessToken });
    setUser(response.user);
    setStatus("authenticated");
  }, []);

  const logout = useCallback(async () => {
    await logoutSession().catch(() => undefined);
    clearSession();
    setUser(null);
    setStatus("guest");
  }, [clearSession]);

  const value = useMemo<AuthSessionContextValue>(
    () => ({
      clearSession,
      login,
      logout,
      register,
      status,
      user,
    }),
    [clearSession, login, logout, register, status, user],
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
