"use client";

import { useCallback } from "react";
import { useRuntimeTestSessionQuery } from "../session/useRuntimeTestSessionQuery";
import type { ToeicCatalogSource } from "@/entities/toeic-catalog";
import {
  preloadFirstTestPartImage,
} from "@/entities/toeic-catalog";

export type UseMockRunQueryParams = {
  sessionId: string;
  testKey?: string | null;
  selectedParts?: number[];
  enabled?: boolean;
};

export function useMockRunQuery({
  sessionId,
  testKey = null,
  selectedParts = [],
  enabled = true,
}: UseMockRunQueryParams) {
  const resolvedSelectedParts = selectedParts.length > 0
    ? selectedParts
    : undefined;
  const preloadInitialImage = useCallback(
    (source: ToeicCatalogSource) => {
      const test = source.manifest.tests.find((candidate) => candidate.id === testKey);
      if (test) {
        preloadFirstTestPartImage(source, test, selectedParts);
      }
    },
    [selectedParts, testKey],
  );

  return useRuntimeTestSessionQuery({
    sessionId,
    mode: "mock_test",
    catalogTestKey: testKey,
    partNumbers: resolvedSelectedParts,
    onCatalogLoaded: preloadInitialImage,
    onTestResolved: testKey ? undefined : preloadFirstTestPartImage,
    enabled,
  });
}
