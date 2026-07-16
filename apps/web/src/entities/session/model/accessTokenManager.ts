// Client-side session lifecycle only (not server RefreshSessions).

import type { AuthResponse } from "@/entities/auth/types";
import { ApiError, isUnauthorizedError } from "@/shared/api/http";
import { refreshSession as refreshSessionRequest } from "@/entities/session/api/refreshSession";
import { isAccessTokenExpired } from "@/entities/session/lib/accessTokenExpiry";
import {
  clearStoredAccessToken,
  getStoredAccessToken,
  setStoredAccessToken,
} from "@/entities/session/model/accessTokenStore";

let refreshPromise: Promise<AuthResponse> | null = null;
let sessionInvalidHandler: (() => void) | null = null;
let sessionGeneration = 0;

const REFRESH_LOCK_NAME = "engvocab-refresh";
const REFRESH_CONFLICT_RETRY_DELAY_MS = 100;
const MAX_REFRESH_CONFLICT_RETRIES = 2;

export function setSessionInvalidHandler(handler: (() => void) | null): void {
  sessionInvalidHandler = handler;
}

/** Store access token after login/register (auth API does not touch session store). */
export function establishSession({ accessToken }: { accessToken: string }): void {
  sessionGeneration += 1;
  refreshPromise = null;
  setStoredAccessToken(accessToken);
}

export function clearClientSession(): void {
  discardClientAccessToken();
  sessionInvalidHandler?.();
}

/** Discard a token after another tab changes the browser session. */
export function discardClientAccessToken(): void {
  sessionGeneration += 1;
  clearStoredAccessToken();
  refreshPromise = null;
}

function waitForRefreshConflictRetry() {
  return new Promise<void>((resolve) => {
    globalThis.setTimeout(resolve, REFRESH_CONFLICT_RETRY_DELAY_MS);
  });
}

function isRefreshConflictError(error: unknown) {
  return error instanceof ApiError && error.status === 409;
}

async function requestRefreshedSession(): Promise<AuthResponse> {
  for (let attempt = 0; attempt <= MAX_REFRESH_CONFLICT_RETRIES; attempt += 1) {
    try {
      return await refreshSessionRequest();
    } catch (error) {
      if (
        !isRefreshConflictError(error) ||
        attempt === MAX_REFRESH_CONFLICT_RETRIES
      ) {
        throw error;
      }

      await waitForRefreshConflictRetry();
    }
  }

  throw new Error("Refresh retry loop exited unexpectedly.");
}

async function refreshAcrossTabs(): Promise<AuthResponse> {
  if (typeof navigator === "undefined" || !("locks" in navigator)) {
    return requestRefreshedSession();
  }

  return navigator.locks.request(REFRESH_LOCK_NAME, requestRefreshedSession);
}

async function fetchRefreshedSession(): Promise<AuthResponse> {
  const refreshGeneration = sessionGeneration;

  try {
    const session = await refreshAcrossTabs();

    if (refreshGeneration !== sessionGeneration) {
      throw new Error("Session changed while refreshing.");
    }

    setStoredAccessToken(session.accessToken);
    return session;
  } catch (error) {
    if (
      refreshGeneration === sessionGeneration &&
      isUnauthorizedError(error)
    ) {
      clearClientSession();
    }

    throw error;
  }
}

function refreshSessionDeduped(): Promise<AuthResponse> {
  if (!refreshPromise) {
    const pendingRefresh = fetchRefreshedSession();
    refreshPromise = pendingRefresh;
    pendingRefresh.then(
      () => {
        if (refreshPromise === pendingRefresh) {
          refreshPromise = null;
        }
      },
      () => {
        if (refreshPromise === pendingRefresh) {
          refreshPromise = null;
        }
      },
    );
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
