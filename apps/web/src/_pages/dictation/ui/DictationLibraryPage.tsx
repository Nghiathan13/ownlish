"use client";

import { RequireAuth } from "@/features/auth";
import { DictationLibrary } from "@/features/dictation-library";
import {
  getDictationCategory,
  useDictationCatalogQuery,
  type DictationCategoryId,
  type DictationCatalogVideo,
} from "@/entities/dictation-library";
import { useT } from "@/shared/lib/providers";
import { secondaryTextButtonClassName } from "@/shared/ui/button";
import { PageShell } from "@/shared/ui/PageShell";
import { Skeleton } from "@/shared/ui/Skeleton";
import { DictationCategoryTabs } from "./DictationCategoryTabs";

const EMPTY_VIDEOS: DictationCatalogVideo[] = [];

type DictationLibraryPageProps = {
  categoryId: DictationCategoryId;
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
  const category = getDictationCategory(categoryId);
  const catalogQuery = useDictationCatalogQuery(category.path);
  const videos = catalogQuery.data?.catalog.videos ?? EMPTY_VIDEOS;
  const retry = () => {
    void catalogQuery.refetch();
  };

  return (
    <PageShell>
      <DictationCategoryTabs activeCategoryId={category.id} />
      {catalogQuery.isLoading ? (
        <DictationLibrarySkeleton />
      ) : catalogQuery.error ? (
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
      ) : (
        <DictationLibrary videos={videos} />
      )}
    </PageShell>
  );
}
