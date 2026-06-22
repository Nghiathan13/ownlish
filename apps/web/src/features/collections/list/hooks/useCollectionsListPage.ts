"use client";

import { useCallback, useMemo, useState } from "react";
import {
  collectionCategoryTabs,
  filterCollectionsByCategory,
  getDefaultUserCollection,
  type CollectionCategory,
} from "@/entities/collection/lib/collectionDisplay";
import { useAuthSession, isAuthenticatedStatus } from "@/features/auth/hooks/useAuthSession";
import {
  useCollectionsList,
  useDeleteCollection,
} from "@/features/collections/shared/hooks/useCollections";

export function useCollectionsListPage() {
  const { status, user } = useAuthSession();
  const isAuthenticated = isAuthenticatedStatus(status);
  const userId = user?.id ?? null;
  const [activeCategory, setActiveCategory] =
    useState<CollectionCategory>("user");
  const [isCreateCollectionOpen, setIsCreateCollectionOpen] = useState(false);
  const { collections, collectionsError, isLoadingCollections, reloadCollections } =
    useCollectionsList({
      isAuthenticated,
      userId,
    });
  const {
    deleteCollection,
    deleteError,
    deletingCollectionId,
    resetDeleteState,
  } = useDeleteCollection({
    userId,
  });
  const defaultCollection = useMemo(() => {
    return getDefaultUserCollection(collections);
  }, [collections]);
  const activeCollections = useMemo(() => {
    return filterCollectionsByCategory(collections, activeCategory);
  }, [activeCategory, collections]);
  const activeTabLabel =
    collectionCategoryTabs.find((tab) => tab.key === activeCategory)?.label ??
    "Collections";
  const isUserTab = activeCategory === "user";

  const handleDeleteCollection = useCallback(
    async (collectionId: string) => {
      resetDeleteState();

      try {
        await deleteCollection(collectionId);
      } catch {
        // deleteError is rendered by the page.
      }
    },
    [deleteCollection, resetDeleteState],
  );

  const openCreateCollection = useCallback(() => {
    setIsCreateCollectionOpen(true);
  }, []);

  const closeCreateCollection = useCallback(() => {
    setIsCreateCollectionOpen(false);
  }, []);

  return {
    activeCategory,
    activeCollections,
    activeTabLabel,
    closeCreateCollection,
    collectionsError,
    defaultCollection,
    deleteError,
    deletingCollectionId,
    handleDeleteCollection,
    isAuthenticated,
    isCreateCollectionOpen,
    isLoadingCollections,
    isUserTab,
    openCreateCollection,
    reloadCollections,
    setActiveCategory,
    userId,
  };
}
