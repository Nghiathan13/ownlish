"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import type { CollectionSummary } from "@/entities/collection/api/collections";
import { getCollection } from "@/entities/collection/api/collections";
import { runAuthenticatedRequest } from "@/entities/session/model/authenticatedRequest";
import type { VocabPageState } from "@/entities/vocab/lib/vocabCache";
import { getVocabQueryKey } from "@/entities/vocab/lib/vocabCache";
import { DEFAULT_VOCABULARY_PAGE_SIZE } from "@/entities/vocab/lib/vocabPagination";
import { listVocabWords } from "@/entities/vocab/api/vocab";
import { useAuthSession } from "@/features/auth/hooks/useAuthSession";
import { getCollectionDetailQueryKey } from "@/features/collections/hooks/useCollections";

export function usePrefetchCollectionDetail() {
  const queryClient = useQueryClient();
  const { user } = useAuthSession();

  return useCallback(
    (collection: CollectionSummary) => {
      const userId = user?.id;

      if (!userId) {
        return;
      }

      if (collection.kind === "SYSTEM") {
        void queryClient.prefetchQuery({
          queryKey: getCollectionDetailQueryKey(userId, collection.id),
          queryFn: ({ signal }) =>
            runAuthenticatedRequest({
              request: (token) =>
                getCollection(token, collection.id, { signal }),
            }),
        });
        return;
      }

      const pageState: VocabPageState = {
        collectionId: collection.id,
        offset: 0,
        pageSize: DEFAULT_VOCABULARY_PAGE_SIZE,
        search: "",
      };

      void queryClient.prefetchQuery({
        queryKey: getVocabQueryKey(userId, pageState),
        queryFn: ({ signal }) =>
          runAuthenticatedRequest({
            request: (token) =>
              listVocabWords(token, {
                collectionId: collection.id,
                limit: pageState.pageSize,
                offset: 0,
                signal,
              }),
          }),
      });
    },
    [queryClient, user?.id],
  );
}
