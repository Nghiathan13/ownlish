"use client";

import { useEffect } from "react";
import {
  submitLearningActivityCheckpoint,
  submitLearningActivityCheckpointKeepalive,
  type LearningActivityCheckpointKind,
  type LearningActivityType,
} from "@/entities/learning-activity";
import { getStoredAccessToken } from "@/entities/session/model/accessTokenStore";
import { runAuthenticatedRequest } from "@/entities/session/model/authenticatedRequest";

const HEARTBEAT_DELAY_MS = 60_000;
const MIN_HEARTBEAT_SECONDS = 45;
const MAX_CHECKPOINT_SECONDS = 75;

type UseLearningActivityTrackerParams = {
  activityType: LearningActivityType;
  enabled: boolean;
};

function isDocumentActive() {
  return document.visibilityState === "visible" && document.hasFocus();
}

export function useLearningActivityTracker({
  activityType,
  enabled,
}: UseLearningActivityTrackerParams) {
  useEffect(() => {
    let heartbeatTimer: number | null = null;
    let isActive = false;
    let isSending = false;
    let lastCheckpointAt = 0;

    function clearHeartbeat() {
      if (heartbeatTimer !== null) {
        window.clearTimeout(heartbeatTimer);
        heartbeatTimer = null;
      }
    }

    function getElapsedSeconds() {
      return Math.floor((Date.now() - lastCheckpointAt) / 1000);
    }

    function scheduleHeartbeat() {
      clearHeartbeat();
      if (!isActive) return;

      const elapsedMs = Date.now() - lastCheckpointAt;
      const delay = Math.max(0, HEARTBEAT_DELAY_MS - elapsedMs);
      heartbeatTimer = window.setTimeout(() => {
        submitCheckpoint("heartbeat");
      }, delay);
    }

    function submitCheckpoint(
      kind: LearningActivityCheckpointKind,
      useKeepalive = false,
    ) {
      if (!isActive) return;

      const elapsedSeconds = getElapsedSeconds();
      if (elapsedSeconds < 1) return;
      if (kind === "heartbeat" && elapsedSeconds < MIN_HEARTBEAT_SECONDS) {
        scheduleHeartbeat();
        return;
      }
      if (elapsedSeconds > MAX_CHECKPOINT_SECONDS) {
        lastCheckpointAt = Date.now();
        scheduleHeartbeat();
        return;
      }

      lastCheckpointAt = Date.now();
      const input = { activityType, elapsedSeconds, kind };

      if (useKeepalive) {
        const token = getStoredAccessToken();
        if (token) {
          submitLearningActivityCheckpointKeepalive(token, input);
        }
        return;
      }

      if (isSending) {
        scheduleHeartbeat();
        return;
      }

      isSending = true;
      void runAuthenticatedRequest({
        request: (token) => submitLearningActivityCheckpoint(token, input),
      })
        .catch(() => undefined)
        .finally(() => {
          isSending = false;
          scheduleHeartbeat();
        });
    }

    function start() {
      if (!enabled || isActive || !isDocumentActive()) return;

      isActive = true;
      lastCheckpointAt = Date.now();
      scheduleHeartbeat();
    }

    function stop(useKeepalive = false) {
      if (!isActive) return;

      clearHeartbeat();
      submitCheckpoint("flush", useKeepalive);
      isActive = false;
      lastCheckpointAt = 0;
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "visible" && document.hasFocus()) {
        start();
      } else {
        stop(true);
      }
    }

    function handleFocus() {
      start();
    }

    function handleBlur() {
      stop(true);
    }

    function handlePageHide() {
      stop(true);
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);
    window.addEventListener("blur", handleBlur);
    window.addEventListener("pagehide", handlePageHide);
    start();

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("pagehide", handlePageHide);
      stop();
    };
  }, [activityType, enabled]);
}
