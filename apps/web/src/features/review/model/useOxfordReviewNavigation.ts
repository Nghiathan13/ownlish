"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  DEFAULT_OXFORD_BAND,
  parseOxfordBand,
  parseOxfordGroupParam,
  type OxfordBand,
} from "@/entities/collection";
import { getOxfordPartReviewQueryOptions } from "@/entities/review";
import {
  DEFAULT_OXFORD_REVIEW_GROUP,
  getOxfordReviewPath,
} from "../lib/oxfordReviewPath";

export {
  DEFAULT_OXFORD_REVIEW_GROUP,
  getOxfordReviewLegacyPathRedirect,
  getOxfordReviewPath,
  getOxfordReviewPathRedirectTarget,
  OXFORD_REVIEW_PATH,
} from "../lib/oxfordReviewPath";

type UseOxfordReviewNavigationParams = {
  bandParam: string | null;
  isAuthenticated: boolean;
  groupParam: string | null;
  userId: string | null;
};

type OxfordReviewLocation = {
  band: OxfordBand;
  part: number;
};

export function useOxfordReviewNavigation({
  bandParam,
  isAuthenticated,
  groupParam,
  userId,
}: UseOxfordReviewNavigationParams) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const routeBand = parseOxfordBand(bandParam) ?? DEFAULT_OXFORD_BAND;
  const routePart =
    parseOxfordGroupParam(groupParam) ?? DEFAULT_OXFORD_REVIEW_GROUP;
  const routePath = getOxfordReviewPath(routeBand, routePart);
  const isGroupCanonical =
    groupParam !== null && groupParam === String(routePart);
  const shouldResetPath =
    parseOxfordBand(bandParam) == null || !isGroupCanonical;
  const [location, setLocation] = useState<OxfordReviewLocation>({
    band: routeBand,
    part: routePart,
  });
  const pendingPathRef = useRef<string | null>(null);

  useEffect(() => {
    if (shouldResetPath) {
      router.replace(routePath, { scroll: false });
      return;
    }

    if (
      pendingPathRef.current === null ||
      pendingPathRef.current === routePath
    ) {
      pendingPathRef.current = null;
      setLocation({ band: routeBand, part: routePart });
    }
  }, [routeBand, routePart, routePath, router, shouldResetPath]);

  useEffect(() => {
    const resetPendingNavigation = () => {
      pendingPathRef.current = null;
    };

    window.addEventListener("popstate", resetPendingNavigation);

    return () => {
      window.removeEventListener("popstate", resetPendingNavigation);
    };
  }, []);

  const navigate = useCallback(
    (band: OxfordBand, part: number) => {
      const nextPath = getOxfordReviewPath(band, part);

      if (nextPath === pendingPathRef.current) {
        return;
      }

      pendingPathRef.current = nextPath;
      setLocation({ band, part });

      if (`${window.location.pathname}${window.location.search}` !== nextPath) {
        window.history.pushState(null, "", nextPath);
      }

      if (isAuthenticated && userId) {
        void queryClient.prefetchQuery(
          getOxfordPartReviewQueryOptions(userId, band, part),
        );
      }

      router.push(nextPath, { scroll: false });
    },
    [isAuthenticated, queryClient, router, userId],
  );

  const navigateBand = useCallback(
    (band: OxfordBand) => {
      navigate(band, DEFAULT_OXFORD_REVIEW_GROUP);
    },
    [navigate],
  );

  const navigatePart = useCallback(
    (part: number) => {
      navigate(location.band, part);
    },
    [location.band, navigate],
  );

  return {
    band: location.band,
    navigateBand,
    navigatePart,
    part: location.part,
  };
}
