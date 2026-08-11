"use client";

import { useCallback, useMemo, useState } from "react";
import { type CollectionSummary, useCollectionsListQuery } from "@/entities/collection";
import {
  collectionCategoryTabs,
  filterCollectionsByCategory,
  getDefaultUserCollection,
  type CollectionCategory,
} from "@/entities/collection";
import { useAuthSession, isAuthenticatedStatus } from "@/entities/session";
import {
  useDeleteCollection,
  useImportCollection,
} from "../mutations/hooks";

export function useCollectionsListPage(activeCategory: CollectionCategory) {
  const { status, user } = useAuthSession();
  const isAuthenticated = isAuthenticatedStatus(status);
  const userId = user?.id ?? null;
  const [isCreateCollectionOpen, setIsCreateCollectionOpen] = useState(false);
  const [editingCollection, setEditingCollection] =
    useState<CollectionSummary | null>(null);
  const [pendingDeleteCollection, setPendingDeleteCollection] =
    useState<CollectionSummary | null>(null);
  const [importingCollectionId, setImportingCollectionId] = useState<
    string | null
  >(null);

  const { collections, collectionsError, isLoadingCollections, reloadCollections } =
    useCollectionsListQuery({
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
  const {
    importCollection,
    importError,
    resetImportState,
  } = useImportCollection({
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

  const requestDeleteCollection = useCallback(
    (collection: CollectionSummary) => {
      resetDeleteState();
      setPendingDeleteCollection(collection);
    },
    [resetDeleteState],
  );

  const cancelDeleteCollection = useCallback(() => {
    if (deletingCollectionId) {
      return;
    }

    setPendingDeleteCollection(null);
  }, [deletingCollectionId]);

  const confirmDeleteCollection = useCallback(async () => {
    if (!pendingDeleteCollection) {
      return;
    }

    resetDeleteState();

    try {
      await deleteCollection(pendingDeleteCollection.id);
      setPendingDeleteCollection(null);
    } catch {
      // deleteError is rendered by the page.
    }
  }, [deleteCollection, pendingDeleteCollection, resetDeleteState]);

  const handleImportSystemCollection = useCallback(
    async (systemCollectionId: string) => {
      if (!defaultCollection?.id) {
        return;
      }

      resetImportState();
      setImportingCollectionId(systemCollectionId);

      try {
        await importCollection({
          systemCollectionId,
          targetCollectionId: defaultCollection.id,
        });
      } catch {
        // importError is rendered by the grid.
      } finally {
        setImportingCollectionId(null);
      }
    },
    [defaultCollection, importCollection, resetImportState],
  );

  const canImportSystemCollections =
    isAuthenticated && Boolean(defaultCollection?.id);

  const openCreateCollection = useCallback(() => {
    setIsCreateCollectionOpen(true);
  }, []);

  const closeCreateCollection = useCallback(() => {
    setIsCreateCollectionOpen(false);
  }, []);

  const openEditCollection = useCallback((collection: CollectionSummary) => {
    setEditingCollection(collection);
  }, []);

  const closeEditCollection = useCallback(() => {
    setEditingCollection(null);
  }, []);

  return {
    activeCategory,
    activeCollections,
    activeTabLabel,
    canImportSystemCollections,
    closeCreateCollection,
    closeEditCollection,
    collectionsError,
    defaultCollection,
    deleteError,
    deletingCollectionId,
    editingCollection,
    cancelDeleteCollection,
    confirmDeleteCollection,
    handleImportSystemCollection,
    importError,
    importingCollectionId,
    isAuthenticated,
    isCreateCollectionOpen,
    isLoadingCollections,
    isUserTab,
    openCreateCollection,
    openEditCollection,
    pendingDeleteCollection,
    reloadCollections,
    requestDeleteCollection,
    userId,
  };
}
