"use client";

import { useMemo } from "react";
import { useQueries } from "@tanstack/react-query";
import { getToeicTestPart } from "@/features/tests/api/getToeicTestPart";
import type { ToeicQuestionGroup } from "@/features/tests/api/types";
import { normalizeSelectedParts } from "@/features/tests/lib/toeicParts";
import { runAuthenticatedRequest } from "@/features/auth/lib/authRequest";

type UseTestPartGroupsParams = {
  accessToken: string | null;
  clearSession: () => void;
  testId: number;
  selectedParts: number[];
};

export function useTestPartGroups({
  accessToken,
  clearSession,
  testId,
  selectedParts,
}: UseTestPartGroupsParams) {
  const normalizedSelectedParts = useMemo(
    () => normalizeSelectedParts(selectedParts),
    [selectedParts],
  );

  const partQueries = useQueries({
    queries: normalizedSelectedParts.map((partNumber) => ({
      queryKey: ["test-part", testId, partNumber],
      queryFn: ({ signal }: { signal: AbortSignal }) =>
        runAuthenticatedRequest({
          accessToken,
          clearSession,
          request: (token) =>
            getToeicTestPart(token, testId, partNumber, { signal }),
        }),
      enabled: Boolean(accessToken),
    })),
  });

  const partGroups = useMemo(() => {
    const groups: Record<number, ToeicQuestionGroup[]> = {};

    for (let index = 0; index < normalizedSelectedParts.length; index += 1) {
      const partNumber = normalizedSelectedParts[index];
      if (partNumber != null && partQueries[index]?.data?.groups) {
        groups[partNumber] = partQueries[index].data!.groups;
      }
    }

    return groups;
  }, [normalizedSelectedParts, partQueries]);

  const allPartsLoaded =
    normalizedSelectedParts.length > 0 &&
    partQueries.every((query) => query.data);
  const isLoadingParts = partQueries.some((query) => query.isLoading);
  const partLoadError = partQueries.find((query) => query.error)?.error;

  return {
    allPartsLoaded,
    isLoadingParts,
    normalizedSelectedParts,
    partGroups,
    partLoadError,
  };
}
