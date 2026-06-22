"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { CollectionSummary } from "@/entities/collection/api/collections";
import {
  collectionCategoryTabs,
  filterCollectionsByCategory,
  getCollectionSlug,
  type CollectionCategory,
} from "@/entities/collection/lib/collectionDisplay";
import { useAuthSession, isAuthenticatedStatus } from "@/features/auth/hooks/useAuthSession";
import { CreateCollectionModal } from "@/features/collections/components/CreateCollectionModal";
import { MyVocabularyCard } from "@/features/collections/components/MyVocabularyCard";
import {
  MY_VOCABULARY_CARD_ID,
  type ExpandedUserCollectionCardId,
} from "@/features/collections/constants/myVocabulary";
import { useCollectionsList } from "@/features/collections/hooks/useCollections";
import { useVocabStats } from "@/features/home/hooks/useVocabStats";
import { MyVocabularyWordsPanel } from "@/features/vocabulary/components/MyVocabularyWordsPanel";
import {
  primaryTextButtonClassName,
  secondaryTextButtonClassName,
} from "@/shared/ui/button";
import { AddIcon } from "@/shared/ui/icons/AddIcon";
import { PageShell } from "@/shared/ui/PageShell";
import { Panel } from "@/shared/ui/Panel";

export function CollectionsPage() {
  const { status, user } = useAuthSession();
  const isAuthenticated = isAuthenticatedStatus(status);
  const [activeCategory, setActiveCategory] =
    useState<CollectionCategory>("user");
  const [isCreateCollectionOpen, setIsCreateCollectionOpen] = useState(false);
  const [expandedCardId, setExpandedCardId] =
    useState<ExpandedUserCollectionCardId>(null);
  const { collections, collectionsError, isLoadingCollections, reloadCollections } =
    useCollectionsList({
      isAuthenticated,
      userId: user?.id ?? null,
    });
  const { isLoading: isLoadingVocabStats, stats: vocabStats } = useVocabStats({
    isAuthenticated,
    userId: user?.id ?? null,
  });
  const activeCollections = useMemo(() => {
    return filterCollectionsByCategory(collections, activeCategory);
  }, [activeCategory, collections]);
  const activeTabLabel =
    collectionCategoryTabs.find((tab) => tab.key === activeCategory)?.label ??
    "Collections";
  const isUserTab = activeCategory === "user";
  const isMyVocabularyExpanded = expandedCardId === MY_VOCABULARY_CARD_ID;

  function toggleMyVocabularyExpanded() {
    setExpandedCardId((current) =>
      current === MY_VOCABULARY_CARD_ID ? null : MY_VOCABULARY_CARD_ID,
    );
  }

  return (
    <PageShell>
      <Panel>
        <div className="mb-6 flex flex-wrap gap-2">
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
                setExpandedCardId(null);
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
          <div className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <MyVocabularyCard
                isExpanded={isMyVocabularyExpanded}
                isLoadingWordCount={isLoadingVocabStats}
                onToggleViewWords={toggleMyVocabularyExpanded}
                wordCount={vocabStats?.total ?? null}
              />
              {activeCollections.map((collection) => (
                <CollectionCard
                  activeTabLabel={activeTabLabel}
                  collection={collection}
                  key={collection.id}
                />
              ))}
              <CreateCollectionCard
                onClick={() => setIsCreateCollectionOpen(true)}
              />
            </div>

            {isMyVocabularyExpanded ? (
              <Panel className="flex min-h-[32rem] flex-col">
                <MyVocabularyWordsPanel />
              </Panel>
            ) : null}
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
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {activeCollections.map((collection) => (
              <CollectionCard
                activeTabLabel={activeTabLabel}
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

function CollectionCard({
  activeTabLabel,
  collection,
}: {
  activeTabLabel: string;
  collection: CollectionSummary;
}) {
  const categoryLabel =
    collection.kind === "USER"
      ? "My collection"
      : (collection.source ?? activeTabLabel);

  return (
    <article className="rounded-xl border border-border p-5 transition hover:bg-muted">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            {categoryLabel}
          </p>
          <h2 className="text-xl font-bold">{collection.name}</h2>
        </div>
        {collection.cefrLevel ? (
          <span className="rounded-full border border-border px-2.5 py-1 text-xs font-semibold">
            {collection.cefrLevel}
          </span>
        ) : null}
      </div>

      <p className="mb-5 min-h-12 text-sm text-muted-foreground">
        {collection.description ??
          `Review ${collection.itemCount} words in this collection.`}
      </p>

      <div className="flex items-center justify-between gap-4">
        <p className="text-sm font-semibold">{collection.itemCount} words</p>
        <Link
          className={secondaryTextButtonClassName()}
          href={`/collections/${getCollectionSlug(collection)}`}
        >
          View words
        </Link>
      </div>
    </article>
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
