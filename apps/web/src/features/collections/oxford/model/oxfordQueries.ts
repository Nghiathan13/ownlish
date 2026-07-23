import { getOxfordCollectionMeta, getOxfordPart } from "@/entities/collection/api/collections";
import {
  getOxfordCollectionMetaQueryKey,
  getOxfordPartQueryKey,
} from "@/entities/collection/lib/collectionsCache";
import { runAuthenticatedRequest } from "@/entities/session/model/authenticatedRequest";
import type { OxfordBand } from "@/features/collections/oxford/lib/oxfordNavigation";

export const OXFORD_QUERY_STALE_TIME = 60_000;

export function getOxfordCollectionMetaQueryOptions(band: OxfordBand) {
  return {
    queryKey: getOxfordCollectionMetaQueryKey(band),
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
