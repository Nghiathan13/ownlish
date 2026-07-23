"use client";

import { useQuery } from "@tanstack/react-query";
import type { OxfordBand } from "@/features/collections/oxford/lib/oxfordNavigation";
import { toQueryErrorMessage } from "@/features/collections/shared/lib/toQueryErrorMessage";
import { getOxfordPartQueryOptions } from "./oxfordQueries";

export function useOxfordPartQuery({
  band,
  enabled = true,
  isAuthenticated,
  part,
}: {
  band: OxfordBand;
  enabled?: boolean;
  isAuthenticated: boolean;
  part: number;
}) {
  const query = useQuery({
    ...getOxfordPartQueryOptions(band, part),
    enabled: enabled && isAuthenticated,
    staleTime: 60_000,
  });

  return {
    error: toQueryErrorMessage(query.error, "Cannot load Oxford part."),
    isLoading: query.isLoading,
    part: query.data ?? null,
    reload: query.refetch,
  };
}
