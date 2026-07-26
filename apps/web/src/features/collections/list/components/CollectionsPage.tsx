"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { usePathname, useRouter } from "next/navigation";
import {
  getCollectionsListPath,
  type CollectionCategory,
} from "@/entities/collection/lib/collectionDisplay";
import {
  isAuthenticatedStatus,
  useAuthSession,
} from "@/features/auth/hooks/useAuthSession";
import { CreateCollectionModal } from "@/features/collections/shared/components/CreateCollectionModal";
import { EditCollectionModal } from "@/features/collections/shared/components/EditCollectionModal";
import { CollectionCategorySelect } from "@/features/collections/list/components/CollectionCategorySelect";
import { CollectionsListBody } from "@/features/collections/list/components/CollectionsListBody";
import { OxfordCollections } from "@/features/collections/oxford/components/OxfordCollections";
import { ClearHistoryConfirmModal } from "@/features/tests/overview/components/ClearHistoryConfirmModal";
import { formatMessage } from "@/shared/i18n/messages";
import { useT } from "@/shared/providers/LocaleProvider";
import {
  getOxfordPath,
  parseOxfordBand,
  parseOxfordGroup,
  type OxfordBand,
} from "@/features/collections/oxford/lib/oxfordNavigation";
import { getOxfordCollectionMetaQueryOptions } from "@/features/collections/oxford/model/oxfordQueries";
import { getCollectionsListQueryOptions } from "@/features/collections/shared/data/hooks/useCollectionsListQuery";
import { useCollectionsListPage } from "@/features/collections/list/hooks/useCollectionsListPage";
import { PageShell } from "@/shared/ui/PageShell";

type CollectionsLocation = {
  category: CollectionCategory;
  band: OxfordBand;
  groupParam: string | null;
};

function getLocation(pathname: string): CollectionsLocation {
  const match = pathname.match(/^\/collections\/oxford\/([^/]+)(?:\/([^/]+))?$/);
  const band = parseOxfordBand(match?.[1] ?? null);

  if (band) {
    return {
      category: "oxford",
      band,
      groupParam: match?.[2] ?? null,
    };
  }

  return { category: "user", band: "A1", groupParam: null };
}

function getLocationPath(location: CollectionsLocation) {
  if (location.category === "user") {
    return getCollectionsListPath("user");
  }

  const group = parseOxfordGroup(location.groupParam);
  return getOxfordPath(location.band, group ?? undefined);
}

function UserCollectionsPage({ onCategoryChange }: { onCategoryChange: (category: CollectionCategory) => void }) {
  const t = useT();
  const page = useCollectionsListPage("user");
  const pendingDelete = page.pendingDeleteCollection;

  return (
    <PageShell>
      <div className="my-3 px-4 lg:my-6 lg:px-16">
        <CollectionCategorySelect
          activeCategory="user"
          onCategoryChange={onCategoryChange}
        />
      </div>
      <CollectionsListBody
        activeCollections={page.activeCollections}
        collectionsError={page.collectionsError}
        defaultCollection={page.defaultCollection}
        deleteError={page.deleteError}
        deletingCollectionId={page.deletingCollectionId}
        isAuthenticated={page.isAuthenticated}
        isLoadingCollections={page.isLoadingCollections}
        onCreateCollection={page.openCreateCollection}
        onDeleteCollection={page.requestDeleteCollection}
        onEditCollection={page.openEditCollection}
        onRetry={page.reloadCollections}
        userId={page.userId}
      />
      <CreateCollectionModal
        isOpen={page.isCreateCollectionOpen}
        onClose={page.closeCreateCollection}
      />
      <EditCollectionModal
        collection={page.editingCollection}
        onClose={page.closeEditCollection}
        userId={page.userId}
      />
      {pendingDelete ? (
        <ClearHistoryConfirmModal
          cancelLabel={t("collections.deleteCollectionCancel")}
          confirmLabel={t("collections.deleteCollectionConfirm")}
          confirmingLabel={t("collections.deleting")}
          isConfirming={page.deletingCollectionId === pendingDelete.id}
          onClose={page.cancelDeleteCollection}
          onConfirm={() => void page.confirmDeleteCollection()}
          subtitle={t("collections.deleteCollectionSubtitle")}
          title={formatMessage(t("collections.deleteNamed"), {
            name: pendingDelete.name,
          })}
        />
      ) : null}
    </PageShell>
  );
}

export function CollectionsPage() {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { status, user } = useAuthSession();
  const isAuthenticated = isAuthenticatedStatus(status);
  const userId = user?.id ?? null;
  const routeLocation = useMemo(() => getLocation(pathname), [pathname]);
  const [location, setLocation] = useState(routeLocation);
  const pendingPathRef = useRef<string | null>(null);

  useEffect(() => {
    const routePath = getLocationPath(routeLocation);
    if (pendingPathRef.current === null || pendingPathRef.current === routePath) {
      pendingPathRef.current = null;
      setLocation(routeLocation);
    }
  }, [routeLocation]);

  const navigate = useCallback(
    (nextLocation: CollectionsLocation) => {
      const nextPath = getLocationPath(nextLocation);
      if (nextPath === pendingPathRef.current) {
        return;
      }

      pendingPathRef.current = nextPath;
      setLocation(nextLocation);

      if (window.location.pathname !== nextPath) {
        window.history.pushState(null, "", nextPath);
      }

      if (isAuthenticated && userId) {
        if (nextLocation.category === "oxford") {
          void queryClient.prefetchQuery(
            getOxfordCollectionMetaQueryOptions(userId, nextLocation.band),
          );
        } else {
          void queryClient.prefetchQuery(getCollectionsListQueryOptions(userId));
        }
      }

      router.push(nextPath, { scroll: false });
    },
    [isAuthenticated, queryClient, router, userId],
  );

  const handleCategoryChange = useCallback(
    (category: CollectionCategory) => {
      navigate({ category, band: "A1", groupParam: null });
    },
    [navigate],
  );

  if (location.category === "oxford") {
    return (
      <PageShell>
        <OxfordCollections
          bandParam={location.band}
          groupParam={location.groupParam}
          onCategoryChange={handleCategoryChange}
        />
      </PageShell>
    );
  }

  return <UserCollectionsPage onCategoryChange={handleCategoryChange} />;
}
