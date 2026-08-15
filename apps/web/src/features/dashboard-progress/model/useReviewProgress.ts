"use client";

import { useMemo, useState } from "react";
import { useQueries } from "@tanstack/react-query";
import type {
  CollectionSummary,
  OxfordProgressSummary,
} from "@/entities/collection";
import { getOxfordProgressSummary } from "@/entities/collection";
import { getOxfordProgressSummaryQueryKey } from "@/entities/collection";
import { getUserOwnedCollections } from "@/entities/collection";
import {
  OXFORD_BANDS,
  type OxfordBand,
} from "@/entities/collection";
import { runAuthenticatedRequest } from "@/entities/session";
import type { VocabStats } from "@/entities/vocab";
import { getVocabStats } from "@/entities/vocab";
import { getVocabStatsQueryKey } from "@/entities/vocab";
import { useVocabStats } from "@/entities/vocab";
import type { VocabStatsCollectionId } from "@/entities/vocab";
import {
  EMPTY_PROGRESS,
  mergeOxfordProgress,
  mergeVocabStats,
  toCollectionProgress,
} from "../lib/reviewProgress";
import {
  getSelectionMode,
  isFullSelection,
} from "../lib/progressSelection";
import type { ProgressSource } from "./types";
import {
  useOxfordProgressSummary,
  type OxfordProgressBand,
} from "./useOxfordProgressSummary";
import { ApiError } from "@/shared/api";

export type ProgressFilterOption = {
  id: string;
  label: string;
};

export function useReviewProgress({
  collections,
  isAuthenticated,
  source,
  userId,
}: {
  collections: CollectionSummary[];
  isAuthenticated: boolean;
  source: ProgressSource;
  userId: string | null;
}) {
  const userCollections = getUserOwnedCollections(collections);
  const collectionOptions = useMemo<ProgressFilterOption[]>(
    () =>
      userCollections.map((collection) => ({
        id: collection.id,
        label: collection.name,
      })),
    [userCollections],
  );
  const bandOptions = useMemo<ProgressFilterOption[]>(
    () => OXFORD_BANDS.map((band) => ({ id: band, label: band })),
    [],
  );
  const allCollectionIds = useMemo(
    () => collectionOptions.map((option) => option.id),
    [collectionOptions],
  );
  const allBandIds = useMemo(
    () => bandOptions.map((option) => option.id),
    [bandOptions],
  );
  // null = all selected (default, and when new items appear they stay included)
  const [selectedCollectionIds, setSelectedCollectionIds] = useState<
    string[] | null
  >(null);
  const [selectedBandIds, setSelectedBandIds] = useState<string[] | null>(null);

  const activeCollectionIds = selectedCollectionIds ?? allCollectionIds;
  const activeBandIds = selectedBandIds ?? allBandIds;
  const isAllCollectionsSelected =
    allCollectionIds.length === 0 ||
    (activeCollectionIds.length === allCollectionIds.length &&
      allCollectionIds.every((id) => activeCollectionIds.includes(id)));
  const isAllBandsSelected =
    allBandIds.length === 0 ||
    (activeBandIds.length === allBandIds.length &&
      allBandIds.every((id) => activeBandIds.includes(id)));

  const collectionSelectionMode = getSelectionMode(
    activeCollectionIds.length,
    isAllCollectionsSelected,
  );
  const bandSelectionMode = getSelectionMode(
    activeBandIds.length,
    isAllBandsSelected,
  );

  const singleCollectionId: VocabStatsCollectionId | null =
    collectionSelectionMode === "single" ? activeCollectionIds[0] : "all";
  const singleBand: OxfordProgressBand =
    bandSelectionMode === "single"
      ? (activeBandIds[0] as OxfordBand)
      : "all";

  const vocab = useVocabStats({
    collectionId:
      source === "collection" &&
      (collectionSelectionMode === "all" || collectionSelectionMode === "single")
        ? singleCollectionId
        : null,
    enabled:
      source === "collection" &&
      (collectionSelectionMode === "all" || collectionSelectionMode === "single"),
    isAuthenticated,
    runAuthenticatedRequest,
    userId,
  });
  const oxford = useOxfordProgressSummary({
    band:
      source === "oxford" &&
      (bandSelectionMode === "all" || bandSelectionMode === "single")
        ? singleBand
        : "all",
    enabled:
      source === "oxford" &&
      (bandSelectionMode === "all" || bandSelectionMode === "single"),
    isAuthenticated,
    userId,
  });

  const multiCollectionQueries = useQueries({
    queries: activeCollectionIds.map((collectionId) => ({
      queryKey: getVocabStatsQueryKey(userId, collectionId),
      queryFn: ({ signal }: { signal: AbortSignal }) =>
        runAuthenticatedRequest({
          request: (token) =>
            getVocabStats(token, {
              collectionId,
              signal,
            }),
        }),
      enabled:
        source === "collection" &&
        collectionSelectionMode === "multi" &&
        isAuthenticated &&
        Boolean(userId),
    })),
  });
  const multiBandQueries = useQueries({
    queries: activeBandIds.map((band) => ({
      queryKey: getOxfordProgressSummaryQueryKey(userId, band as OxfordBand),
      queryFn: ({ signal }: { signal: AbortSignal }) =>
        runAuthenticatedRequest({
          request: (token) =>
            getOxfordProgressSummary(token, {
              band: band as OxfordBand,
              signal,
            }),
        }),
      enabled:
        source === "oxford" &&
        bandSelectionMode === "multi" &&
        isAuthenticated &&
        Boolean(userId),
    })),
  });

  const multiCollectionStats = useMemo(() => {
    if (collectionSelectionMode !== "multi") return null;
    const stats = multiCollectionQueries
      .map((query) => query.data)
      .filter((item): item is VocabStats => item != null);
    if (stats.length === 0) return null;
    return mergeVocabStats(stats);
  }, [collectionSelectionMode, multiCollectionQueries]);

  const multiBandSummary = useMemo(() => {
    if (bandSelectionMode !== "multi") return null;
    const summaries = multiBandQueries
      .map((query) => query.data)
      .filter((item): item is OxfordProgressSummary => item != null);
    if (summaries.length === 0) return null;
    return mergeOxfordProgress(summaries);
  }, [bandSelectionMode, multiBandQueries]);

  const progress =
    source === "collection"
      ? collectionSelectionMode === "empty"
        ? EMPTY_PROGRESS
        : collectionSelectionMode === "multi"
          ? toCollectionProgress(multiCollectionStats)
          : toCollectionProgress(vocab.stats)
      : bandSelectionMode === "empty"
        ? EMPTY_PROGRESS
        : bandSelectionMode === "multi"
          ? multiBandSummary
          : oxford.summary;

  const error =
    source === "collection"
      ? collectionSelectionMode === "multi"
        ? firstQueryError(multiCollectionQueries)
        : vocab.error
      : bandSelectionMode === "multi"
        ? firstQueryError(multiBandQueries)
        : oxford.error;

  const isLoading =
    source === "collection"
      ? collectionSelectionMode === "empty"
        ? false
        : collectionSelectionMode === "multi"
          ? multiCollectionQueries.some((query) => query.isLoading)
          : vocab.isLoading
      : bandSelectionMode === "empty"
        ? false
        : bandSelectionMode === "multi"
          ? multiBandQueries.some((query) => query.isLoading)
          : oxford.isLoading;

  function toggleCollection(id: string) {
    setSelectedCollectionIds((current) => {
      const base = current ?? allCollectionIds;
      const next = base.includes(id)
        ? base.filter((item) => item !== id)
        : [...base, id];
      return isFullSelection(next, allCollectionIds) ? null : next;
    });
  }

  function toggleBand(id: string) {
    setSelectedBandIds((current) => {
      const base = current ?? allBandIds;
      const next = base.includes(id)
        ? base.filter((item) => item !== id)
        : [...base, id];
      return isFullSelection(next, allBandIds) ? null : next;
    });
  }

  return {
    activeBandIds,
    activeCollectionIds,
    bandOptions,
    collectionOptions,
    error,
    isLoading,
    progress,
    toggleBand,
    toggleCollection,
  };
}

function firstQueryError(
  queries: Array<{ error: Error | null }>,
): string | null {
  const error = queries.find((query) => query.error)?.error;
  if (!error) return null;
  return error instanceof ApiError ? error.message : "Cannot load dashboard.";
}
