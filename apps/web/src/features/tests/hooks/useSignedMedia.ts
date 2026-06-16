"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { refreshTestPartMedia } from "@/features/tests/api/testsApi";
import type { ToeicQuestionGroup } from "@/features/tests/api/types";
import { runAuthenticatedRequest } from "@/features/auth/lib/authRequest";

const REFRESH_BUFFER_MS = 2 * 60 * 1000;

type SignedMediaState = {
  audioUrl: string | null;
  audioUrlExpiresAt: string | null;
  imageUrl: string | null;
  imageUrlExpiresAt: string | null;
};

type UseSignedMediaParams = {
  testId: number;
  partNumber: number;
  group: ToeicQuestionGroup | null;
  accessToken: string | null;
  clearSession: () => void;
};

function getEmptyMedia(): SignedMediaState {
  return {
    audioUrl: null,
    audioUrlExpiresAt: null,
    imageUrl: null,
    imageUrlExpiresAt: null,
  };
}

function getMediaFromGroup(group: ToeicQuestionGroup | null): SignedMediaState {
  if (!group) {
    return getEmptyMedia();
  }

  return {
    audioUrl: group.audioUrl,
    audioUrlExpiresAt: group.audioUrlExpiresAt,
    imageUrl: group.imageUrl,
    imageUrlExpiresAt: group.imageUrlExpiresAt,
  };
}

export function useSignedMedia({
  testId,
  partNumber,
  group,
  accessToken,
  clearSession,
}: UseSignedMediaParams) {
  const [overrides, setOverrides] = useState<Record<number, SignedMediaState>>(
    {},
  );
  const [mediaError, setMediaError] = useState<string | null>(null);

  const media = useMemo(() => {
    if (!group) {
      return getEmptyMedia();
    }

    return overrides[group.id] ?? getMediaFromGroup(group);
  }, [group, overrides]);

  const refresh = useCallback(async () => {
    if (!group || !accessToken) {
      return;
    }

    const refreshed = await runAuthenticatedRequest({
      accessToken,
      clearSession,
      request: (token) =>
        refreshTestPartMedia(token, testId, partNumber, [group.id]),
    });
    const next = refreshed.find((item) => item.id === group.id);
    if (!next) {
      setMediaError("Cannot refresh media.");
      return;
    }

    setOverrides((current) => ({
      ...current,
      [group.id]: {
        audioUrl: next.audioUrl,
        audioUrlExpiresAt: next.audioUrlExpiresAt,
        imageUrl: next.imageUrl,
        imageUrlExpiresAt: next.imageUrlExpiresAt,
      },
    }));
    setMediaError(null);
  }, [accessToken, clearSession, group, partNumber, testId]);

  useEffect(() => {
    if (!group) {
      return;
    }

    const expiryTimes = [media.audioUrlExpiresAt, media.imageUrlExpiresAt]
      .filter((value): value is string => Boolean(value))
      .map((value) => Date.parse(value));

    if (expiryTimes.length === 0) {
      return;
    }

    const nextExpiry = Math.min(...expiryTimes);
    const delay = nextExpiry - Date.now() - REFRESH_BUFFER_MS;

    if (delay <= 0) {
      const timer = window.setTimeout(() => {
        void refresh();
      }, 0);
      return () => window.clearTimeout(timer);
    }

    const timer = window.setTimeout(() => {
      void refresh();
    }, delay);

    return () => window.clearTimeout(timer);
  }, [
    group,
    media.audioUrlExpiresAt,
    media.imageUrlExpiresAt,
    refresh,
  ]);

  const handleMediaError = useCallback(() => {
    void refresh().catch(() => {
      setMediaError("Cannot load media. Please try again.");
    });
  }, [refresh]);

  return {
    audioUrl: media.audioUrl,
    imageUrl: media.imageUrl,
    mediaError,
    handleMediaError,
    refreshMedia: refresh,
  };
}
