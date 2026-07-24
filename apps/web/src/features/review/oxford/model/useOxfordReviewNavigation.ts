"use client";

import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import type { OxfordBand } from "@/features/collections/oxford/lib/oxfordNavigation";
import { getOxfordPartReviewQueryOptions } from "./oxfordReviewQueries";

type UseOxfordReviewNavigationParams = {
  activeBand: OxfordBand;
  isAuthenticated: boolean;
  userId: string | null;
};

function getReviewPath(band: OxfordBand, part: number) {
  return `/review/oxford/${band}/part-${part}`;
}

export function useOxfordReviewNavigation({
  activeBand,
  isAuthenticated,
  userId,
}: UseOxfordReviewNavigationParams) {
  const queryClient = useQueryClient();
  const router = useRouter();

  const navigate = useCallback(
    (band: OxfordBand, part: number) => {
      if (isAuthenticated && userId) {
        void queryClient.prefetchQuery(
          getOxfordPartReviewQueryOptions(userId, band, part),
        );
      }

      router.push(getReviewPath(band, part), { scroll: false });
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
      navigate(activeBand, part);
    },
    [activeBand, navigate],
  );

  return { navigateBand, navigatePart };
}
