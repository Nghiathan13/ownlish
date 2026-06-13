"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  collectionCategoryTabs,
  getCollectionCategory,
  getCollectionSlug,
  type CollectionCategory,
} from "@/entities/collection/lib/collectionDisplay";
import { useAuthSession } from "@/features/auth/hooks/useAuthSession";
import { useCollectionsList } from "@/features/collections/hooks/useCollections";
import { classNames } from "@/shared/lib/classNames";
import { Button } from "@/shared/ui/Button";
import { PageShell } from "@/shared/ui/PageShell";
import { Panel } from "@/shared/ui/Panel";

export function CollectionsPage() {
  const { accessToken, clearSession, status, user } = useAuthSession();
  const [activeCategory, setActiveCategory] =
    useState<CollectionCategory>("oxford");
  const { collections, collectionsError, isLoadingCollections, reloadCollections } =
    useCollectionsList({
      accessToken,
      clearSession,
      isAuthenticated: status === "authenticated",
      userId: user?.id ?? null,
    });
  const activeCollections = useMemo(() => {
    return collections.filter(
      (collection) => getCollectionCategory(collection) === activeCategory,
    );
  }, [activeCategory, collections]);
  const activeTabLabel =
    collectionCategoryTabs.find((tab) => tab.key === activeCategory)?.label ??
    "Collections";

  return (
    <PageShell>
      <Panel>
        <div className="mb-6 flex flex-wrap gap-2">
          {collectionCategoryTabs.map((tab) => (
            <button
              className={classNames(
                "rounded-lg border px-3.5 py-2 text-sm font-semibold transition",
                activeCategory === tab.key
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-transparent text-foreground hover:bg-muted",
              )}
              key={tab.key}
              onClick={() => setActiveCategory(tab.key)}
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
              <article
                className="rounded-xl border border-border p-5 transition hover:bg-muted"
                key={collection.id}
              >
                <div className="mb-5 flex items-start justify-between gap-3">
                  <div>
                    <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      {collection.source ?? activeTabLabel}
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
                  <p className="text-sm font-semibold">
                    {collection.itemCount} words
                  </p>
                  <Link
                    className="inline-flex items-center justify-center rounded-lg border border-border bg-transparent px-3.5 py-2.5 text-sm font-semibold text-foreground transition hover:bg-background"
                    href={`/collections/${getCollectionSlug(collection)}`}
                  >
                    View words
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </Panel>
    </PageShell>
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
      <Button
        className="w-fit"
        onClick={() => {
          void onRetry();
        }}
        type="button"
        variant="secondary"
      >
        Retry
      </Button>
    </div>
  );
}
