"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { CollectionSummary } from "@/entities/collection/api/collections";
import {
  collectionCategoryTabs,
  filterCollectionsByCategory,
  getCollectionPath,
  getDefaultUserCollection,
  type CollectionCategory,
} from "@/entities/collection/lib/collectionDisplay";
import { useAuthSession, isAuthenticatedStatus } from "@/features/auth/hooks/useAuthSession";
import { CreateCollectionModal } from "@/features/collections/components/CreateCollectionModal";
import { MyVocabularyCard } from "@/features/collections/components/MyVocabularyCard";
import { CollectionReviewLink } from "@/features/collections/components/CollectionReviewLink";
import {
  useCollectionsList,
  useDeleteCollection,
} from "@/features/collections/hooks/useCollections";
import {
  iconOnlyButtonClassName,
  primaryTextButtonClassName,
  secondaryTextButtonClassName,
} from "@/shared/ui/button";
import { AddIcon } from "@/shared/ui/icons/AddIcon";
import { DeleteForeverIcon } from "@/shared/ui/icons/DeleteForeverIcon";
import { PageShell } from "@/shared/ui/PageShell";
import { statusColorClasses } from "@/shared/ui/theme/statusColors";

export function CollectionsPage() {
  const { status, user } = useAuthSession();
  const isAuthenticated = isAuthenticatedStatus(status);
  const [activeCategory, setActiveCategory] =
    useState<CollectionCategory>("user");
  const [isCreateCollectionOpen, setIsCreateCollectionOpen] = useState(false);
  const { collections, collectionsError, isLoadingCollections, reloadCollections } =
    useCollectionsList({
      isAuthenticated,
      userId: user?.id ?? null,
    });
  const {
    deleteCollection,
    deleteError,
    deletingCollectionId,
    resetDeleteState,
  } = useDeleteCollection({
    userId: user?.id ?? null,
  });
  const defaultCollection = useMemo(() => {
    return getDefaultUserCollection(collections);
  }, [collections]);
  const activeCollections = useMemo(() => {
    return filterCollectionsByCategory(collections, activeCategory);
  }, [activeCategory, collections]);
  const myVocabularyHref = defaultCollection
    ? getCollectionPath(defaultCollection)
    : null;
  const activeTabLabel =
    collectionCategoryTabs.find((tab) => tab.key === activeCategory)?.label ??
    "Collections";
  const isUserTab = activeCategory === "user";

  async function handleDeleteCollection(collectionId: string) {
    resetDeleteState();

    try {
      await deleteCollection(collectionId);
    } catch {
      // deleteError is rendered below.
    }
  }

  return (
    <PageShell>
      <div className="mb-4 flex flex-wrap gap-2 px-4">
          {collectionCategoryTabs.map((tab) => (
            <button
              className={
                activeCategory === tab.key
                  ? primaryTextButtonClassName()
                  : secondaryTextButtonClassName()
              }
              key={tab.key}
              onClick={() => {
                setActiveCategory(tab.key);
              }}
              type="button"
            >
              {tab.label}
            </button>
          ))}
        </div>

        {isLoadingCollections ? (
          <p className="px-4 text-muted-foreground">Loading collections...</p>
        ) : collectionsError ? (
          <div className="px-4">
            <StateMessage message={collectionsError} onRetry={reloadCollections} />
          </div>
        ) : isUserTab ? (
          <div className="mb-4 grid gap-4 px-4">
            {deleteError ? (
              <p className="text-sm text-danger">{deleteError}</p>
            ) : null}
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <MyVocabularyCard
                collectionId={defaultCollection?.id ?? null}
                href={myVocabularyHref}
                isAuthenticated={isAuthenticated}
                userId={user?.id ?? null}
              />
              {activeCollections.map((collection) => (
                <UserCollectionCard
                  collection={collection}
                  deletingCollectionId={deletingCollectionId}
                  isAuthenticated={isAuthenticated}
                  key={collection.id}
                  onDelete={handleDeleteCollection}
                  userId={user?.id ?? null}
                />
              ))}
              <CreateCollectionCard
                onClick={() => setIsCreateCollectionOpen(true)}
              />
            </div>
          </div>
        ) : activeCollections.length === 0 ? (
          <div className="mx-4 rounded-xl border border-border p-6">
            <h2 className="mb-2 text-xl font-semibold">
              No {activeTabLabel} collections yet.
            </h2>
            <p className="text-muted-foreground">
              This category is ready for future word sets.
            </p>
          </div>
        ) : (
          <div className="mb-4 grid gap-4 px-4 sm:grid-cols-2 xl:grid-cols-3">
            {activeCollections.map((collection) => (
              <SystemCollectionCard
                collection={collection}
                key={collection.id}
              />
            ))}
          </div>
        )}
      <CreateCollectionModal
        isOpen={isCreateCollectionOpen}
        onClose={() => setIsCreateCollectionOpen(false)}
      />
    </PageShell>
  );
}

function CreateCollectionCard({ onClick }: { onClick: () => void }) {
  return (
    <button
      className="flex min-h-[220px] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border p-5 text-muted-foreground transition hover:border-foreground hover:bg-muted hover:text-foreground"
      onClick={onClick}
      type="button"
    >
      <AddIcon className="size-8" />
      <span className="text-sm font-semibold">New collection</span>
    </button>
  );
}

function UserCollectionCard({
  collection,
  deletingCollectionId,
  isAuthenticated,
  onDelete,
  userId,
}: {
  collection: CollectionSummary;
  deletingCollectionId: string | null;
  isAuthenticated: boolean;
  onDelete: (collectionId: string) => void;
  userId: string | null;
}) {
  const isDeleting = deletingCollectionId === collection.id;
  const collectionHref = getCollectionPath(collection);

  return (
    <article className="relative rounded-xl border border-border hover:bg-muted">
      <Link
        aria-label={`View ${collection.name}`}
        className="absolute inset-0 rounded-xl"
        href={collectionHref}
      />
      <button
        aria-label={
          isDeleting ? "Deleting collection" : `Delete ${collection.name}`
        }
        className={iconOnlyButtonClassName(
          "absolute right-3 top-3 z-20 bg-transparent",
          statusColorClasses.danger.text,
          statusColorClasses.danger.backgroundHover,
        )}
        disabled={isDeleting}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          void onDelete(collection.id);
        }}
        type="button"
      >
        <DeleteForeverIcon />
      </button>
      <div className="pointer-events-none relative p-4 pb-14">
        <h2 className="pr-10 text-xl font-bold">{collection.name}</h2>
        <p className="mt-5 text-sm font-semibold">{collection.itemCount} words</p>
      </div>
      <div className="absolute bottom-4 right-4">
        <CollectionReviewLink
          collectionId={collection.id}
          isAuthenticated={isAuthenticated}
          userId={userId}
        />
      </div>
    </article>
  );
}

function SystemCollectionCard({
  collection,
}: {
  collection: CollectionSummary;
}) {
  return (
    <Link
      className="block rounded-xl border border-border p-4 hover:bg-muted"
      href={getCollectionPath(collection)}
    >
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-xl font-bold">{collection.name}</h2>
        {collection.cefrLevel ? (
          <span className="rounded-full border border-border px-2.5 py-1 text-xs font-semibold">
            {collection.cefrLevel}
          </span>
        ) : null}
      </div>
      <p className="mt-5 text-sm font-semibold">{collection.itemCount} words</p>
    </Link>
  );
}

function StateMessage({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="grid gap-4 rounded-xl border border-border p-4">
      <p className="text-sm text-muted-foreground">{message}</p>
      <button
        className={secondaryTextButtonClassName("w-fit")}
        onClick={() => {
          void onRetry();
        }}
        type="button"
      >
        Retry
      </button>
    </div>
  );
}
