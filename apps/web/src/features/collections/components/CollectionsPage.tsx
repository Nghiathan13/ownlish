"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { CollectionSummary } from "@/entities/collection/api/collections";
import {
  collectionCategoryTabs,
  filterCollectionsByCategory,
  getCollectionSlug,
  getDefaultUserCollection,
  type CollectionCategory,
} from "@/entities/collection/lib/collectionDisplay";
import { useAuthSession, isAuthenticatedStatus } from "@/features/auth/hooks/useAuthSession";
import { CreateCollectionModal } from "@/features/collections/components/CreateCollectionModal";
import { MyVocabularyCard } from "@/features/collections/components/MyVocabularyCard";
import {
  useCollectionsList,
  useDeleteCollection,
} from "@/features/collections/hooks/useCollections";
import { useVocabStats } from "@/features/home/hooks/useVocabStats";
import {
  iconOnlyButtonClassName,
  primaryTextButtonClassName,
  secondaryTextButtonClassName,
} from "@/shared/ui/button";
import { AddIcon } from "@/shared/ui/icons/AddIcon";
import { DeleteForeverIcon } from "@/shared/ui/icons/DeleteForeverIcon";
import { PageShell } from "@/shared/ui/PageShell";
import { Panel } from "@/shared/ui/Panel";
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
  const { isLoading: isLoadingVocabStats, stats: vocabStats } = useVocabStats({
    collectionId: defaultCollection?.id ?? null,
    isAuthenticated,
    userId: user?.id ?? null,
  });
  const activeCollections = useMemo(() => {
    return filterCollectionsByCategory(collections, activeCategory);
  }, [activeCategory, collections]);
  const myVocabularyHref = defaultCollection
    ? `/collections/${getCollectionSlug(defaultCollection)}`
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
      <Panel>
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
          <p className="text-muted-foreground">Loading collections...</p>
        ) : collectionsError ? (
          <StateMessage message={collectionsError} onRetry={reloadCollections} />
        ) : isUserTab ? (
          <div className="mb-4 grid gap-4 px-4">
            {deleteError ? (
              <p className="text-sm text-danger">{deleteError}</p>
            ) : null}
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <MyVocabularyCard
                href={myVocabularyHref}
                isLoadingWordCount={isLoadingVocabStats}
                wordCount={vocabStats?.total ?? null}
              />
              {activeCollections.map((collection) => (
                <UserCollectionCard
                  collection={collection}
                  deletingCollectionId={deletingCollectionId}
                  key={collection.id}
                  onDelete={handleDeleteCollection}
                />
              ))}
              <CreateCollectionCard
                onClick={() => setIsCreateCollectionOpen(true)}
              />
            </div>
          </div>
        ) : activeCollections.length === 0 ? (
          <div className="rounded-xl border border-border p-6">
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
      </Panel>

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
  onDelete,
}: {
  collection: CollectionSummary;
  deletingCollectionId: string | null;
  onDelete: (collectionId: string) => void;
}) {
  const isDeleting = deletingCollectionId === collection.id;

  return (
    <article className="relative rounded-xl border border-border hover:bg-muted">
      <button
        aria-label={
          isDeleting ? "Deleting collection" : `Delete ${collection.name}`
        }
        className={iconOnlyButtonClassName(
          "absolute right-3 top-3 z-10 bg-transparent",
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
      <Link
        className="block p-4"
        href={`/collections/${getCollectionSlug(collection)}`}
      >
        <h2 className="pr-10 text-xl font-bold">{collection.name}</h2>
        <p className="mt-5 text-sm font-semibold">{collection.itemCount} words</p>
      </Link>
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
      href={`/collections/${getCollectionSlug(collection)}`}
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
