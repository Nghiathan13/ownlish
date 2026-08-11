"use client";

import { useMemo, useRef, useState, type ReactNode } from "react";
import type { AuthUser } from "@/entities/auth/types";
import {
  AuthSessionContext,
  type AuthSessionContextValue,
  type AuthStatus,
  useAuthSessionActions,
  useAuthSessionBootstrap,
} from "@/features/auth";

/**
 * App-layer provider (FSD App): wires the auth session feature into the tree.
 * Session logic lives in `features/auth/model`.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<AuthUser | null>(null);
  const sessionChannelRef = useRef<BroadcastChannel | null>(null);

  useAuthSessionBootstrap({
    sessionChannelRef,
    setStatus,
    setUser,
  });

  const actions = useAuthSessionActions({
    sessionChannelRef,
    setStatus,
    setUser,
  });

  const value = useMemo<AuthSessionContextValue>(
    () => ({
      ...actions,
      status,
      user,
    }),
    [actions, status, user],
  );

  return (
    <AuthSessionContext.Provider value={value}>
      {children}
    </AuthSessionContext.Provider>
  );
}
