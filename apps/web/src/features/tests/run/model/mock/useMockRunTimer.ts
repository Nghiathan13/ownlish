"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { updateRuntimeMockTimer } from "@/entities/toeic-runtime/api/runtime";
import { isAccessTokenExpired } from "@/entities/session/lib/accessTokenExpiry";
import { getStoredAccessToken } from "@/entities/session/model/accessTokenStore";
import { runAuthenticatedRequest } from "@/entities/session/model/authenticatedRequest";
import { formatMockCountdown } from "@/features/tests/shared/lib/mockTestTimer";

const TIMER_SYNC_INTERVAL_MS = 60_000;

type UseMockRunTimerParams = {
  sessionId: string;
  initialRemainingSeconds: number | null;
  enabled: boolean;
  onExpire: () => void;
};

export function useMockRunTimer({
  sessionId,
  initialRemainingSeconds,
  enabled,
  onExpire,
}: UseMockRunTimerParams) {
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(
    initialRemainingSeconds,
  );
  const [isDocumentVisible, setIsDocumentVisible] = useState(
    () => typeof document === "undefined" || document.visibilityState === "visible",
  );
  const remainingSecondsRef = useRef(initialRemainingSeconds);
  const isDocumentVisibleRef = useRef(
    typeof document === "undefined" || document.visibilityState === "visible",
  );
  const initializedSessionIdRef = useRef<string | null>(null);
  const syncPromiseRef = useRef<Promise<void> | null>(null);
  const hasExpiredRef = useRef(false);

  const setRemaining = useCallback((nextRemainingSeconds: number | null) => {
    remainingSecondsRef.current = nextRemainingSeconds;
    setRemainingSeconds(nextRemainingSeconds);
  }, []);

  useEffect(() => {
    if (initializedSessionIdRef.current !== sessionId) {
      initializedSessionIdRef.current = sessionId;
      hasExpiredRef.current = false;
      setRemaining(initialRemainingSeconds);
      return;
    }

    if (remainingSecondsRef.current === null && initialRemainingSeconds !== null) {
      setRemaining(initialRemainingSeconds);
    }
  }, [initialRemainingSeconds, sessionId, setRemaining]);

  const syncTimer = useCallback(async () => {
    const currentRemainingSeconds = remainingSecondsRef.current;
    if (!enabled || currentRemainingSeconds === null || syncPromiseRef.current) {
      return;
    }

    const syncPromise = runAuthenticatedRequest({
      request: (token) =>
        updateRuntimeMockTimer(token, sessionId, currentRemainingSeconds),
    }).then(({ remainingSeconds: serverRemainingSeconds }) => {
      const latestRemainingSeconds = remainingSecondsRef.current;
      if (latestRemainingSeconds === null) {
        return;
      }

      setRemaining(Math.min(latestRemainingSeconds, serverRemainingSeconds));
    });
    syncPromiseRef.current = syncPromise;

    try {
      await syncPromise;
    } catch {
      // The next heartbeat or answer submission will try again.
    } finally {
      if (syncPromiseRef.current === syncPromise) {
        syncPromiseRef.current = null;
      }
    }
  }, [enabled, sessionId, setRemaining]);

  const syncTimerOnPageHide = useCallback(() => {
    const currentRemainingSeconds = remainingSecondsRef.current;
    const accessToken = getStoredAccessToken();
    if (
      !enabled ||
      currentRemainingSeconds === null ||
      !accessToken ||
      isAccessTokenExpired(accessToken, { skewSeconds: 0 })
    ) {
      return;
    }

    void updateRuntimeMockTimer(accessToken, sessionId, currentRemainingSeconds, {
      keepalive: true,
    }).catch(() => undefined);
  }, [enabled, sessionId]);

  const getRemainingSeconds = useCallback(
    () => remainingSecondsRef.current,
    [],
  );

  useEffect(() => {
    const handleVisibilityChange = () => {
      const visible = document.visibilityState === "visible";
      isDocumentVisibleRef.current = visible;
      setIsDocumentVisible(visible);
      if (!visible) {
        void syncTimer();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", syncTimerOnPageHide);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", syncTimerOnPageHide);
    };
  }, [syncTimer, syncTimerOnPageHide]);

  useEffect(() => syncTimerOnPageHide, [syncTimerOnPageHide]);

  useEffect(() => {
    if (
      !enabled ||
      !isDocumentVisible ||
      remainingSeconds === null ||
      remainingSeconds <= 0
    ) {
      return;
    }

    const interval = window.setInterval(() => {
      if (!isDocumentVisibleRef.current) {
        return;
      }

      const currentRemainingSeconds = remainingSecondsRef.current;
      if (currentRemainingSeconds === null) {
        return;
      }

      setRemaining(Math.max(0, currentRemainingSeconds - 1));
    }, 1_000);

    return () => window.clearInterval(interval);
  }, [enabled, isDocumentVisible, remainingSeconds, setRemaining]);

  useEffect(() => {
    if (!enabled || !isDocumentVisible || remainingSeconds === null) {
      return;
    }

    const interval = window.setInterval(() => {
      if (isDocumentVisibleRef.current) {
        void syncTimer();
      }
    }, TIMER_SYNC_INTERVAL_MS);

    return () => window.clearInterval(interval);
  }, [enabled, isDocumentVisible, remainingSeconds, syncTimer]);

  useEffect(() => {
    if (!enabled || remainingSeconds !== 0 || hasExpiredRef.current) {
      return;
    }

    hasExpiredRef.current = true;
    void syncTimer().finally(onExpire);
  }, [enabled, onExpire, remainingSeconds, syncTimer]);

  return {
    getRemainingSeconds,
    hasExpired: remainingSeconds === 0,
    remainingSeconds,
    timerLabel:
      remainingSeconds === null ? null : formatMockCountdown(remainingSeconds),
  };
}
