"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { RequireAuth } from "@/features/auth";
import { DictationLibrary } from "@/features/dictation-library";
import {
  findDictationCatalogCategory,
  getDictationCategoryPath,
  useDictationCatalogIndexQuery,
  useDictationCatalogQuery,
  type DictationCatalogIndexCategory,
  type DictationCatalogVideo,
} from "@/entities/dictation-library";
import { useT } from "@/shared/lib/providers";
import { secondaryTextButtonClassName } from "@/shared/ui/button";
import { PageShell } from "@/shared/ui/PageShell";
import { Skeleton } from "@/shared/ui/Skeleton";
import { DictationCategoryTabs } from "./DictationCategoryTabs";

const EMPTY_VIDEOS: DictationCatalogVideo[] = [];
const EMPTY_CATEGORIES: DictationCatalogIndexCategory[] = [];

type DictationLibraryPageProps = {
  categoryId?: string;
};

export function DictationLibraryPage({ categoryId }: DictationLibraryPageProps) {
  return (
    <RequireAuth>
      <DictationLibraryPageContent categoryId={categoryId} />
    </RequireAuth>
  );
}

function DictationLibrarySkeleton() {
  return (
    <div className="mb-4 grid gap-4 px-4 sm:grid-cols-2 xl:grid-cols-3 lg:px-16">
      {Array.from({ length: 3 }, (_, index) => (
        <Skeleton className="h-72 rounded-lg" key={index} />
      ))}
    </div>
  );
}

function DictationLibraryPageContent({ categoryId }: DictationLibraryPageProps) {
  const t = useT();
  const router = useRouter();
  const indexQuery = useDictationCatalogIndexQuery();
  const categories = indexQuery.data?.index.categories ?? EMPTY_CATEGORIES;
  const activeCategory = categoryId
    ? findDictationCatalogCategory(categories, categoryId)
    : null;
  const catalogQuery = useDictationCatalogQuery(activeCategory?.path ?? null);
  const videos = catalogQuery.data?.catalog.videos ?? EMPTY_VIDEOS;

  useEffect(() => {
    if (categoryId || !indexQuery.data) {
      return;
    }

    const firstCategory = indexQuery.data.index.categories[0];
    if (firstCategory) {
      router.replace(getDictationCategoryPath(firstCategory.id));
    }
  }, [categoryId, indexQuery.data, router]);

  const isLoading =
    indexQuery.isLoading ||
    (!categoryId && Boolean(indexQuery.data?.index.categories[0])) ||
    (Boolean(activeCategory) && catalogQuery.isLoading);
  const loadError = indexQuery.error || catalogQuery.error;
  const retry = () => {
    void indexQuery.refetch();
    void catalogQuery.refetch();
  };

  return (
    <PageShell>
      {isLoading ? (
        <DictationLibrarySkeleton />
      ) : !categoryId && categories.length === 0 ? (
        <DictationLibrary videos={EMPTY_VIDEOS} />
      ) : loadError ? (
        <div className="px-4 text-sm text-muted-foreground lg:px-16">
          <div className="space-y-3">
            <p>{t("dictation.catalogLoadError")}</p>
            <button
              className={secondaryTextButtonClassName()}
              onClick={retry}
              type="button"
            >
              {t("dictation.retry")}
            </button>
          </div>
        </div>
      ) : !activeCategory ? (
        <DictationLibrarySkeleton />
      ) : (
        <>
          <DictationCategoryTabs
            activeCategoryId={activeCategory.id}
            categories={categories}
          />
          <DictationLibrary videos={videos} />
        </>
      )}
    </PageShell>
  );
}
