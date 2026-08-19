"use client";

import Link from "next/link";
import {
  getDictationThumbnailUrl,
  type DictationCatalogVideo,
} from "@/entities/dictation-library";
import { useDictationProgressQueries } from "@/entities/dictation-study";
import { isAuthenticatedStatus, useAuthSession } from "@/entities/session";
import { useT } from "@/shared/lib/providers";
import { MusicIcon } from "@/shared/ui/icons";

type DictationLibraryProps = {
  videos: DictationCatalogVideo[];
};

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

export function DictationLibrary({ videos }: DictationLibraryProps) {
  const t = useT();
  const { status, user } = useAuthSession();
  const progressQueries = useDictationProgressQueries({
    enabled: isAuthenticatedStatus(status) && Boolean(user),
    userId: user?.id ?? null,
    videoIds: videos.map((video) => video.id),
  });

  return (
    <div className="mb-4 grid gap-4 px-4 sm:grid-cols-2 xl:grid-cols-3 lg:px-16">
      {videos.map((video, index) => {
        const progress = progressQueries[index]?.data;
        const href = `/dictation/${video.id}`;

        return (
          <Link
            className="group block overflow-hidden rounded-lg border border-transparent bg-surface-card hover:border-primary focus-visible:border-primary focus-visible:outline-none"
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
              <span className="absolute right-2 bottom-2 inline-flex items-center gap-0.5 rounded bg-surface-subtle px-1 py-0.5 text-xs font-medium tabular-nums text-foreground">
                {video.category === "Music" ? <MusicIcon className="size-3.5" /> : null}
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
  );
}
