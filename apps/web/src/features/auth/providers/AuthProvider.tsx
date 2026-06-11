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
  getCurrentUser,
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
    localStorage.setItem(ACCESS_TOKEN_KEY, session.accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, session.refreshToken);
    setAccessToken(session.accessToken);
    setUser(session.user);
    setStatus("authenticated");
  }, []);

  useEffect(() => {
    const storedAccessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
    const storedRefreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    let cancelled = false;

    async function restoreSession() {
      if (!storedAccessToken && !storedRefreshToken) {
        if (cancelled) {
          return;
        }

        setStatus("guest");
        return;
      }

      if (storedAccessToken) {
        try {
          const nextUser = await getCurrentUser(storedAccessToken);

          if (!cancelled) {
            setAccessToken(storedAccessToken);
            setUser(nextUser);
            setStatus("authenticated");
          }

          return;
        } catch (error) {
          if (!isUnauthorizedError(error) || !storedRefreshToken) {
            if (!cancelled) {
              clearSession();
            }

            return;
          }
        }
      }

      if (!storedRefreshToken) {
        if (!cancelled) {
          clearSession();
        }

        return;
      }

      try {
        const session = await refreshSession({
          refreshToken: storedRefreshToken,
        });

        if (!cancelled) {
          saveSession(session);
        }
      } catch {
        if (!cancelled) {
          clearSession();
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
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);

    if (refreshToken) {
      await logoutSession({ refreshToken }).catch(() => undefined);
    }

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
