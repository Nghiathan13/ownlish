"use client";

import { RequireAuth } from "@/features/auth";
import {
  findDictationCatalogCategory,
  useDictationCatalogIndexQuery,
} from "@/entities/dictation-library";
import { useT } from "@/shared/lib/providers";
import { secondaryTextButtonClassName } from "@/shared/ui/button";
import { PageShell } from "@/shared/ui/PageShell";
import { Skeleton } from "@/shared/ui/Skeleton";
import { DictationLibraryPage } from "./DictationLibraryPage";
import { DictationStudyPage } from "./DictationStudyPage";

type DictationSlugPageProps = {
  slug: string;
};

export function DictationSlugPage({ slug }: DictationSlugPageProps) {
  return (
    <RequireAuth>
      <DictationSlugPageContent slug={slug} />
    </RequireAuth>
  );
}

function DictationSlugPageContent({ slug }: DictationSlugPageProps) {
  const t = useT();
  const indexQuery = useDictationCatalogIndexQuery();
  const category = findDictationCatalogCategory(
    indexQuery.data?.index.categories ?? [],
    slug,
  );

  if (indexQuery.isLoading) {
    return (
      <PageShell>
        <div className="mb-4 grid gap-4 px-4 sm:grid-cols-2 xl:grid-cols-3 lg:px-16">
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton className="h-72 rounded-lg" key={index} />
          ))}
        </div>
      </PageShell>
    );
  }

  if (indexQuery.error) {
    return (
      <PageShell>
        <div className="px-4 text-sm text-muted-foreground lg:px-16">
          <div className="space-y-3">
            <p>{t("dictation.catalogLoadError")}</p>
            <button
              className={secondaryTextButtonClassName()}
              onClick={() => void indexQuery.refetch()}
              type="button"
            >
              {t("dictation.retry")}
            </button>
          </div>
        </div>
      </PageShell>
    );
  }

  if (category) {
    return <DictationLibraryPage categoryId={slug} />;
  }

  return <DictationStudyPage videoId={slug} />;
}
