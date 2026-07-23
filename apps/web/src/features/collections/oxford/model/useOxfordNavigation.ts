"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import type { MouseEvent } from "react";
import {
  formatOxfordPartSegment,
  getOxfordPath,
  parseOxfordBand,
  parseOxfordGroup,
  type OxfordBand,
} from "@/features/collections/oxford/lib/oxfordNavigation";
import {
  getOxfordCollectionMetaQueryOptions,
  getOxfordPartQueryOptions,
} from "./oxfordQueries";

type OxfordLocation = {
  band: OxfordBand;
  group: number | null;
};

type UseOxfordNavigationParams = {
  bandParam: string | null;
  groupParam: string | null;
  isAuthenticated: boolean;
};

function getLocationPath({ band, group }: OxfordLocation) {
  return getOxfordPath(band, group ?? undefined);
}

export function shouldHandleOxfordNavigation(
  event: MouseEvent<HTMLAnchorElement>,
) {
  return (
    event.button === 0 &&
    !event.defaultPrevented &&
    !event.metaKey &&
    !event.altKey &&
    !event.ctrlKey &&
    !event.shiftKey
  );
}

export function useOxfordNavigation({
  bandParam,
  groupParam,
  isAuthenticated,
}: UseOxfordNavigationParams) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const routeBand = parseOxfordBand(bandParam) ?? "A1";
  const routeGroup = parseOxfordGroup(groupParam);
  const routePath = getLocationPath({ band: routeBand, group: routeGroup });
  const isGroupSegmentCanonical =
    groupParam === null ||
    (routeGroup !== null && groupParam === formatOxfordPartSegment(routeGroup));
  const shouldResetPath =
    bandParam !== routeBand ||
    (groupParam !== null && routeGroup === null) ||
    (routeGroup !== null && !isGroupSegmentCanonical);
  const [location, setLocation] = useState<OxfordLocation>({
    band: routeBand,
    group: routeGroup,
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
      setLocation({ band: routeBand, group: routeGroup });
    }
  }, [routeBand, routeGroup, routePath, router, shouldResetPath]);

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
    (nextLocation: OxfordLocation) => {
      const nextPath = getLocationPath(nextLocation);

      if (nextPath === pendingPathRef.current) {
        return;
      }

      pendingPathRef.current = nextPath;
      setLocation(nextLocation);

      if (isAuthenticated) {
        if (nextLocation.group === null) {
          void queryClient.prefetchQuery(
            getOxfordCollectionMetaQueryOptions(nextLocation.band),
          );
        } else {
          void queryClient.prefetchQuery(
            getOxfordPartQueryOptions(nextLocation.band, nextLocation.group),
          );
        }
      }

      router.push(nextPath, { scroll: false });
    },
    [isAuthenticated, queryClient, router],
  );

  const navigateBand = useCallback(
    (band: OxfordBand) => {
      navigate({ band, group: null });
    },
    [navigate],
  );

  const navigatePart = useCallback(
    (part: number) => {
      navigate({ band: location.band, group: part });
    },
    [location.band, navigate],
  );

  const navigateOverview = useCallback(() => {
    navigate({ band: location.band, group: null });
  }, [location.band, navigate]);

  return {
    band: location.band,
    group: location.group,
    navigateBand,
    navigateOverview,
    navigatePart,
    shouldResetPath,
  };
}
