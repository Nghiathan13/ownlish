export type CollectionAuthParams = {
  isAuthenticated: boolean;
  userId: string | null;
};

export type CollectionDetailQueryParams = CollectionAuthParams & {
  collectionId: string | null;
  enabled?: boolean;
};

export type CollectionCatalogWordsQueryParams = CollectionAuthParams & {
  collectionId: string | null;
  limit: number;
  offset: number;
};

export type CollectionMutationParams = {
  userId: string | null;
};
