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
  register as registerRequest,
  type LoginInput,
  type RegisterInput,
} from "@/entities/auth/api/auth";

const ACCESS_TOKEN_KEY = "engvocab.accessToken";

export type AuthStatus = "checking" | "authenticated" | "guest";

type AuthSessionContextValue = {
  accessToken: string | null;
  clearSession: () => void;
  login: (input: LoginInput) => Promise<void>;
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
    setAccessToken(null);
    setUser(null);
    setStatus("guest");
  }, []);

  const saveSession = useCallback((token: string, nextUser: AuthUser) => {
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
    setAccessToken(token);
    setUser(nextUser);
    setStatus("authenticated");
  }, []);

  useEffect(() => {
    const token = localStorage.getItem(ACCESS_TOKEN_KEY);
    let cancelled = false;

    if (!token) {
      queueMicrotask(() => {
        if (!cancelled) {
          setStatus("guest");
        }
      });

      return () => {
        cancelled = true;
      };
    }

    getCurrentUser(token)
      .then((nextUser) => {
        if (cancelled) {
          return;
        }

        setAccessToken(token);
        setUser(nextUser);
        setStatus("authenticated");
      })
      .catch(() => {
        if (!cancelled) {
          clearSession();
        }
      });

    return () => {
      cancelled = true;
    };
  }, [clearSession]);

  const login = useCallback(
    async (input: LoginInput) => {
      const response = await loginRequest(input);
      saveSession(response.accessToken, response.user);
    },
    [saveSession],
  );

  const register = useCallback(
    async (input: RegisterInput) => {
      const response = await registerRequest(input);
      saveSession(response.accessToken, response.user);
    },
    [saveSession],
  );

  const value = useMemo<AuthSessionContextValue>(
    () => ({
      accessToken,
      clearSession,
      login,
      register,
      status,
      user,
    }),
    [accessToken, clearSession, login, register, status, user],
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
