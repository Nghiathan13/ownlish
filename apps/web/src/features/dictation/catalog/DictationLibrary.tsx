"use client";

import Link from "next/link";
import { useQueries } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { getDictationProgress, getDictationThumbnailUrl } from "@/entities/dictation/api";
import { runAuthenticatedRequest } from "@/entities/session/model/authenticatedRequest";
import { useAuthSession } from "@/features/auth/hooks/useAuthSession";
import { useDictationCatalogQuery } from "@/entities/dictation/model/useDictationCatalogQuery";
import { getDictationProgressQueryKey } from "@/entities/dictation/model/queries";
import { PageShell } from "@/shared/ui/PageShell";
import { secondaryTextButtonClassName } from "@/shared/ui/button";
import { classNames } from "@/shared/lib/classNames";
import { useT } from "@/shared/providers/LocaleProvider";
import { Skeleton } from "@/shared/ui/Skeleton";
import type { DictationCatalogVideo } from "@/entities/dictation/model/types";

const EMPTY_VIDEOS: DictationCatalogVideo[] = [];

function getProgressLabel(
  progress: { answeredSegmentIds: string[]; completedAt: string | null; correctCount: number } | null | undefined,
  segmentCount: number,
  t: ReturnType<typeof useT>,
) {
  if (!progress) return t("dictation.notStarted");
  if (progress.completedAt) {
    return `${t("dictation.completed")}: ${progress.correctCount}/${segmentCount}`;
  }

  return `${t("dictation.progress")}: ${progress.answeredSegmentIds.length}/${segmentCount}`;
}

function formatDuration(durationSeconds: number) {
  const minutes = Math.floor(durationSeconds / 60);
  const seconds = durationSeconds % 60;

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function DictationLibrary() {
  const t = useT();
  const { status, user } = useAuthSession();
  const catalogQuery = useDictationCatalogQuery();
  const videos = catalogQuery.data?.catalog.videos ?? EMPTY_VIDEOS;
  const categories = useMemo(
    () => Array.from(new Set(videos.map((video) => video.category))),
    [videos],
  );
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const activeCategory = categories.includes(selectedCategory ?? "")
    ? selectedCategory
    : (categories[0] ?? null);
  const categoryVideos = activeCategory
    ? videos.filter((video) => video.category === activeCategory)
    : [];

  const progressQueries = useQueries({
    queries: categoryVideos.map((video) => ({
      queryKey: getDictationProgressQueryKey(user?.id ?? null, video.id),
      queryFn: () =>
        runAuthenticatedRequest({
          request: (token) => getDictationProgress(token, video.id),
        }),
      enabled: status === "authenticated" && Boolean(user),
      retry: false,
    })),
  });

  return (
    <PageShell>
      {catalogQuery.isLoading ? (
        <div className="mb-4 grid gap-4 px-4 sm:grid-cols-2 xl:grid-cols-3 lg:px-16">
            {Array.from({ length: 3 }, (_, index) => (
              <Skeleton className="h-72 rounded-lg" key={index} />
            ))}
        </div>
      ) : catalogQuery.error ? (
        <div className="px-4 text-sm text-muted-foreground lg:px-16">
          <div className="space-y-3">
            <p>{t("dictation.catalogLoadError")}</p>
            <button className={secondaryTextButtonClassName()} onClick={() => void catalogQuery.refetch()} type="button">
              {t("dictation.retry")}
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="my-3 px-4 lg:my-6 lg:px-16">
            <div className="relative">
              <div
                aria-hidden
                className="pointer-events-none absolute bottom-0 -left-4 -right-4 z-0 h-[0.5px] bg-border lg:-left-16 lg:-right-16"
              />
              <div aria-label="Dictation categories" className="relative z-10 flex items-end gap-9 pl-3" role="tablist">
                {categories.map((category) => {
                  const isActive = category === activeCategory;

                  return (
                    <button
                      aria-selected={isActive}
                      className={classNames(
                        "group/dictation-category-tab relative inline-flex cursor-pointer pb-3 text-base font-normal",
                        isActive ? "text-foreground" : "text-muted-foreground",
                      )}
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      role="tab"
                      type="button"
                    >
                      {category}
                      <span
                        aria-hidden
                        className={classNames(
                          "absolute -right-3 -left-3 bottom-[1px] h-[2.5px]",
                          isActive
                            ? "bg-foreground"
                            : "bg-transparent group-hover/dictation-category-tab:bg-border",
                        )}
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="mb-4 grid gap-4 px-4 sm:grid-cols-2 xl:grid-cols-3 lg:px-16">
            {categoryVideos.map((video, index) => {
              const progress = progressQueries[index]?.data;
              const href = `/dictation/${video.id}`;

              return (
                <Link
                  className="group block overflow-hidden rounded-lg border border-transparent bg-surface hover:border-primary focus-visible:border-primary focus-visible:outline-none dark:bg-[#000000]"
                  href={href}
                  key={video.id}
                >
                  <div className="relative">
                    {/* YouTube serves this public thumbnail directly; routing it through Next image optimization adds no value here. */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      alt={video.title}
                      className="aspect-video w-full object-cover"
                      loading="lazy"
                      src={getDictationThumbnailUrl(video.youtubeVideoId)}
                    />
                    <span className="absolute right-2 bottom-2 rounded bg-[#f0f0f0] px-1.5 py-0.5 text-xs font-medium tabular-nums text-foreground dark:bg-surface">
                      {formatDuration(video.durationSeconds)}
                    </span>
                  </div>
                  <div className="p-4">
                    <div className="min-w-0">
                      <h2 className="line-clamp-2 font-semibold text-foreground">{video.title}</h2>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {video.segmentCount} {t("dictation.segments")}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {getProgressLabel(progress, video.segmentCount, t)}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </>
      )}
    </PageShell>
  );
}
