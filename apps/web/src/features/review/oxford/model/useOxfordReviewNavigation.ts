"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  formatOxfordPartSegment,
  parseOxfordBand,
  parseOxfordGroup,
  type OxfordBand,
} from "@/features/collections/oxford/lib/oxfordNavigation";
import { getOxfordPartReviewQueryOptions } from "./oxfordReviewQueries";

type UseOxfordReviewNavigationParams = {
  bandParam: string | null;
  isAuthenticated: boolean;
  partParam: string | null;
  userId: string | null;
};

type OxfordReviewLocation = {
  band: OxfordBand;
  part: number;
};

export function getOxfordReviewPath(band: OxfordBand, part: number) {
  return `/review/oxford/${band}/part-${part}`;
}

export function useOxfordReviewNavigation({
  bandParam,
  isAuthenticated,
  partParam,
  userId,
}: UseOxfordReviewNavigationParams) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const routeBand = parseOxfordBand(bandParam) ?? "A1";
  const routePart = parseOxfordGroup(partParam) ?? 1;
  const routePath = getOxfordReviewPath(routeBand, routePart);
  const isPartSegmentCanonical =
    partParam !== null &&
    parseOxfordGroup(partParam) !== null &&
    partParam === formatOxfordPartSegment(routePart);
  const shouldResetPath =
    bandParam !== routeBand || !isPartSegmentCanonical;
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

      if (window.location.pathname !== nextPath) {
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
      navigate(band, 1);
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
