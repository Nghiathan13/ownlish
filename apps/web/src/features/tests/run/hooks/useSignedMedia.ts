"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { refreshToeicPartMedia } from "@/entities/toeic/api/toeic";
import type { ToeicQuestionGroup } from "@/entities/toeic/api/types";
import { useAuthSession, isAuthenticatedStatus } from "@/features/auth/hooks/useAuthSession";
import { runAuthenticatedRequest } from "@/entities/session/model/authenticatedRequest";
import { getLocaleSnapshot } from "@/shared/i18n/locale";
import { translate } from "@/shared/i18n/messages";

const REFRESH_BUFFER_MS = 2 * 60 * 1000;

type SignedMediaState = {
  audioUrl: string | null;
  audioUrlExpiresAt: string | null;
  imageUrl: string | null;
  imageUrlExpiresAt: string | null;
};

type UseSignedMediaParams = {
  testId: number | null;
  partNumber: number;
  group: ToeicQuestionGroup | null;
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

function getEarliestExpiryMs(state: SignedMediaState): number | null {
  const expiryTimes = [state.audioUrlExpiresAt, state.imageUrlExpiresAt]
    .filter((value): value is string => Boolean(value))
    .map((value) => Date.parse(value));

  if (expiryTimes.length === 0) {
    return null;
  }

  return Math.min(...expiryTimes);
}

export function isSignedMediaStillValid(
  state: SignedMediaState,
  now = Date.now(),
): boolean {
  const expiryMs = getEarliestExpiryMs(state);
  return expiryMs != null && expiryMs > now + REFRESH_BUFFER_MS;
}

export function mergeSignedMediaState(
  preferred: SignedMediaState | undefined,
  incoming: SignedMediaState,
  now = Date.now(),
): SignedMediaState {
  if (!preferred) {
    return incoming;
  }

  if (isSignedMediaStillValid(preferred, now)) {
    return preferred;
  }

  return incoming;
}

export function useSignedMedia({
  testId,
  partNumber,
  group,
}: UseSignedMediaParams) {
  const { status } = useAuthSession();
  const isAuthenticated = isAuthenticatedStatus(status);
  const [overrides, setOverrides] = useState<Record<number, SignedMediaState>>(
    {},
  );
  const [mediaError, setMediaError] = useState<string | null>(null);
  const refreshingRef = useRef(false);
  const usesStaticMedia = Boolean(
    group &&
      (group.audioUrl || group.imageUrl) &&
      !group.audioUrlExpiresAt &&
      !group.imageUrlExpiresAt,
  );

  const media = useMemo(() => {
    if (!group) {
      return getEmptyMedia();
    }

    const fromGroup = getMediaFromGroup(group);
    const override = overrides[group.id];

    return mergeSignedMediaState(override, fromGroup);
  }, [group, overrides]);

  const refresh = useCallback(async (options?: { force?: boolean }) => {
    if (!group || !testId || !isAuthenticated || usesStaticMedia || refreshingRef.current) {
      return;
    }

    if (!options?.force && isSignedMediaStillValid(media)) {
      return;
    }

    refreshingRef.current = true;

    try {
      const refreshed = await runAuthenticatedRequest({
        request: (token) =>
          refreshToeicPartMedia(token, testId, partNumber, [group.id]),
      });
      const next = refreshed.find((item) => item.id === group.id);
      if (!next) {
        setMediaError(
          translate(getLocaleSnapshot(), "tests.cannotRefreshMedia"),
        );
        return;
      }

      const nextMedia: SignedMediaState = {
        audioUrl: next.audioUrl,
        audioUrlExpiresAt: next.audioUrlExpiresAt,
        imageUrl: next.imageUrl,
        imageUrlExpiresAt: next.imageUrlExpiresAt,
      };

      setOverrides((current) => ({
        ...current,
        [group.id]: options?.force
          ? nextMedia
          : mergeSignedMediaState(current[group.id], nextMedia),
      }));
      setMediaError(null);
    } finally {
      refreshingRef.current = false;
    }
  }, [group, isAuthenticated, media, partNumber, testId, usesStaticMedia]);

  useEffect(() => {
    if (!group) {
      return;
    }

    const expiryMs = getEarliestExpiryMs(media);
    if (expiryMs == null) {
      return;
    }

    const delay = expiryMs - Date.now() - REFRESH_BUFFER_MS;
    if (delay <= 0) {
      void refresh();
      return;
    }

    const timer = window.setTimeout(() => {
      void refresh();
    }, delay);

    return () => window.clearTimeout(timer);
  }, [group, media, refresh]);

  const handleMediaError = useCallback(() => {
    if (usesStaticMedia) {
      setMediaError(translate(getLocaleSnapshot(), "tests.cannotLoadMedia"));
      return;
    }

    void refresh({ force: true }).catch(() => {
      setMediaError(translate(getLocaleSnapshot(), "tests.cannotLoadMedia"));
    });
  }, [refresh, usesStaticMedia]);

  return {
    audioUrl: media.audioUrl,
    imageUrl: media.imageUrl,
    mediaError,
    handleMediaError,
    refreshMedia: refresh,
  };
}
