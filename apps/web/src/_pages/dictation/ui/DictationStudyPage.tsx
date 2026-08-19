"use client";

import Link from "next/link";
import { RequireAuth } from "@/features/auth";
import { DictationStudy } from "@/features/dictation-study";
import {
  findDictationCatalogCategoryByLabel,
  getDictationCatalogRootUrl,
  getDictationCategoryPath,
  useDictationCatalogIndexQuery,
  useDictationCatalogQuery,
  type DictationCatalogVideo,
} from "@/entities/dictation-library";
import {
  getDictationVideoDocumentPath,
  useDictationProgressQuery,
  useDictationVideoQuery,
} from "@/entities/dictation-study";
import { isAuthenticatedStatus, useAuthSession } from "@/entities/session";
import { useT } from "@/shared/lib/providers";
import { iconTextButtonClassName } from "@/shared/ui/button";
import { PageShell } from "@/shared/ui/PageShell";
import { Skeleton } from "@/shared/ui/Skeleton";

const EMPTY_VIDEOS: DictationCatalogVideo[] = [];

const dictationBackButtonClassName = iconTextButtonClassName(
  "w-fit shrink-0 border border-border bg-surface-card hover:[box-shadow:inset_0_0_0_9999px_var(--hover-overlay)]",
);

type DictationStudyPageProps = {
  videoId: string;
};

export function DictationStudyPage({ videoId }: DictationStudyPageProps) {
  return (
    <RequireAuth>
      <DictationStudyPageContent videoId={videoId} />
    </RequireAuth>
  );
}

function DictationStudyPageSkeleton() {
  return (
    <div className="w-full px-4 py-4">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,0.7fr)_minmax(0,0.3fr)]">
        <Skeleton className="aspect-video rounded-lg" />
        <Skeleton className="h-[360px] rounded-lg" />
      </div>
    </div>
  );
}

function DictationStudyPageContent({ videoId }: DictationStudyPageProps) {
  const t = useT();
  const { status, user } = useAuthSession();
  const rootUrl = getDictationCatalogRootUrl();
  const videoQuery = useDictationVideoQuery(
    rootUrl ?? undefined,
    { id: videoId, path: getDictationVideoDocumentPath(videoId) },
  );
  const indexQuery = useDictationCatalogIndexQuery();
  const category = videoQuery.data
    ? findDictationCatalogCategoryByLabel(
        indexQuery.data?.index.categories ?? [],
        videoQuery.data.video.category,
      )
    : null;
  const catalogQuery = useDictationCatalogQuery(category?.path ?? null);
  const catalogVideos = catalogQuery.data?.catalog.videos ?? EMPTY_VIDEOS;
  const backHref = category ? getDictationCategoryPath(category.id) : "/dictation";
  const progressQuery = useDictationProgressQuery({
    enabled: isAuthenticatedStatus(status) && Boolean(user),
    userId: user?.id ?? null,
    videoId,
  });
  const isLoading = videoQuery.isLoading || progressQuery.isLoading;
  const loadError =
    videoQuery.error || !rootUrl
      ? t("dictation.lessonNotFound")
      : progressQuery.error
        ? t("dictation.progressLoadError")
        : null;
  const isReady = Boolean(videoQuery.data && !loadError);

  return (
    <PageShell className={isReady ? "lg:overflow-y-hidden" : undefined}>
      {isLoading ? (
        <DictationStudyPageSkeleton />
      ) : !isReady ? (
        <div className="w-full px-4 py-4">
          <div>
            <Link className={dictationBackButtonClassName} href={backHref}>
              {t("dictation.back")}
            </Link>
            <p className="mt-8 text-sm text-muted-foreground">
              {loadError ?? t("dictation.lessonNotFound")}
            </p>
          </div>
        </div>
      ) : (
        <DictationStudy
          key={videoId}
          backHref={backHref}
          catalogVideos={catalogVideos}
          initialProgress={progressQuery.data ?? null}
          video={videoQuery.data}
          videoId={videoId}
        />
      )}
    </PageShell>
  );
}
