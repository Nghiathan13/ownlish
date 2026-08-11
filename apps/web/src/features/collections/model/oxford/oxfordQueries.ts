import { getOxfordCollectionMeta, getOxfordPart } from "@/entities/collection";
import {
  getOxfordCollectionMetaQueryKey,
  getOxfordPartQueryKey,
} from "@/entities/collection";
import { runAuthenticatedRequest } from "@/entities/session";
import type { OxfordBand } from "@/entities/collection";

export const OXFORD_QUERY_STALE_TIME = 60_000;

export function getOxfordCollectionMetaQueryOptions(userId: string, band: OxfordBand) {
  return {
    queryKey: getOxfordCollectionMetaQueryKey(userId, band),
    queryFn: ({ signal }: { signal: AbortSignal }) =>
      runAuthenticatedRequest({
        request: (token) => getOxfordCollectionMeta(token, band, { signal }),
      }),
    staleTime: OXFORD_QUERY_STALE_TIME,
  };
}

export function getOxfordPartQueryOptions(band: OxfordBand, part: number) {
  return {
    queryKey: getOxfordPartQueryKey(band, part),
    queryFn: ({ signal }: { signal: AbortSignal }) =>
      runAuthenticatedRequest({
        request: (token) => getOxfordPart(token, band, part, { signal }),
      }),
    staleTime: OXFORD_QUERY_STALE_TIME,
  };
}
