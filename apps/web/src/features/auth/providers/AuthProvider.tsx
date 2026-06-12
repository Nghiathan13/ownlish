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
  AuthUser,
  login as loginRequest,
  logoutSession,
  refreshSession,
  register as registerRequest,
  type AuthResponse,
  type LoginInput,
  type RegisterInput,
} from "@/entities/auth/api/auth";
import { isUnauthorizedError } from "@/shared/api/http";

const ACCESS_TOKEN_KEY = "engvocab.accessToken";
const REFRESH_TOKEN_KEY = "engvocab.refreshToken";

export type AuthStatus = "checking" | "authenticated" | "guest";

type AuthSessionContextValue = {
  accessToken: string | null;
  clearSession: () => void;
  login: (input: LoginInput) => Promise<void>;
  logout: () => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  status: AuthStatus;
  user: AuthUser | null;
};

const AuthSessionContext = createContext<AuthSessionContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("checking");
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  const clearSession = useCallback(() => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    setAccessToken(null);
    setUser(null);
    setStatus("guest");
  }, []);

  const saveSession = useCallback((session: AuthResponse) => {
    setAccessToken(session.accessToken);
    setUser(session.user);
    setStatus("authenticated");
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      try {
        const session = await refreshSession();

        if (!cancelled) {
          saveSession(session);
        }
      } catch (error) {
        if (!cancelled) {
          if (isUnauthorizedError(error)) {
            clearSession();
          } else {
            setStatus("guest");
          }
        }
      }
    }

    void restoreSession();

    return () => {
      cancelled = true;
    };
  }, [clearSession, saveSession]);

  const login = useCallback(
    async (input: LoginInput) => {
      const response = await loginRequest(input);
      saveSession(response);
    },
    [saveSession],
  );

  const register = useCallback(
    async (input: RegisterInput) => {
      const response = await registerRequest(input);
      saveSession(response);
    },
    [saveSession],
  );

  const logout = useCallback(async () => {
    await logoutSession().catch(() => undefined);
    clearSession();
  }, [clearSession]);

  const value = useMemo<AuthSessionContextValue>(
    () => ({
      accessToken,
      clearSession,
      login,
      logout,
      register,
      status,
      user,
    }),
    [accessToken, clearSession, login, logout, register, status, user],
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
