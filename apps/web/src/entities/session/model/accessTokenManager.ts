// Client-side session lifecycle only (not server RefreshSessions).

import type { AuthResponse } from "@/entities/auth/types";
import { isUnauthorizedError } from "@/shared/api/http";
import { refreshSession as refreshSessionRequest } from "@/entities/session/api/refreshSession";
import { isAccessTokenExpired } from "@/entities/session/lib/accessTokenExpiry";
import {
  clearStoredAccessToken,
  getStoredAccessToken,
  setStoredAccessToken,
} from "@/entities/session/model/accessTokenStore";

let refreshPromise: Promise<AuthResponse> | null = null;
let sessionInvalidHandler: (() => void) | null = null;

export function setSessionInvalidHandler(handler: (() => void) | null): void {
  sessionInvalidHandler = handler;
}

/** Store access token after login/register (auth API does not touch session store). */
export function establishSession({ accessToken }: { accessToken: string }): void {
  setStoredAccessToken(accessToken);
}

export function clearClientSession(): void {
  clearStoredAccessToken();
  refreshPromise = null;
  sessionInvalidHandler?.();
}

async function fetchRefreshedSession(): Promise<AuthResponse> {
  try {
    const session = await refreshSessionRequest();
    setStoredAccessToken(session.accessToken);
    return session;
  } catch (error) {
    if (isUnauthorizedError(error)) {
      clearClientSession();
    }

    throw error;
  }
}

function refreshSessionDeduped(): Promise<AuthResponse> {
  if (!refreshPromise) {
    refreshPromise = fetchRefreshedSession().finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
}

/** Bootstrap session on app mount via HttpOnly refresh cookie; stores token in memory. */
export async function bootstrapClientSession(): Promise<AuthResponse> {
  return refreshSessionDeduped();
}

export async function getValidAccessToken(): Promise<string> {
  const stored = getStoredAccessToken();

  if (stored && !isAccessTokenExpired(stored)) {
    return stored;
  }

  const session = await refreshSessionDeduped();

  return session.accessToken;
}
