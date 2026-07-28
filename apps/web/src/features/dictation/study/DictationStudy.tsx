"use client";

import Link from "next/link";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  getDictationProgress,
  getDictationVideo,
  submitDictationAnswer,
} from "@/entities/dictation/api";
import {
  findDictationVideo,
  getDictationProgressQueryKey,
  getDictationVideoQueryKey,
} from "@/entities/dictation/model/queries";
import type { DictationProgress, DictationSegment } from "@/entities/dictation/model/types";
import { useDictationCatalogQuery } from "@/entities/dictation/model/useDictationCatalogQuery";
import { runAuthenticatedRequest } from "@/entities/session/model/authenticatedRequest";
import { useAuthSession } from "@/features/auth/hooks/useAuthSession";
import { classNames } from "@/shared/lib/classNames";
import { useT } from "@/shared/providers/LocaleProvider";
import { PageShell } from "@/shared/ui/PageShell";
import { iconTextButtonClassName } from "@/shared/ui/button";
import { Skeleton } from "@/shared/ui/Skeleton";
import { DictationHorizontalSplitLayout } from "./DictationHorizontalSplitLayout";
import { DictationSegmentNavigation } from "./DictationSegmentNavigation";
import { DictationSplitLayout } from "./DictationSplitLayout";
import {
  evaluateDictationTyping,
  getSegmentWords,
  type DictationBadgeState,
} from "./lib/dictationTyping";
import { YouTubeSegmentPlayer } from "./YouTubeSegmentPlayer";

const dictationBackButtonClassName = iconTextButtonClassName(
  "w-fit shrink-0 border border-border bg-surface hover:[box-shadow:inset_0_0_0_9999px_var(--hover-overlay)] dark:bg-[#000000]",
);
const noop = () => {};
const EMPTY_SEGMENTS: DictationSegment[] = [];
const EMPTY_HINTED_WORD_INDEXES: number[] = [];

function getActiveSegment(
  segments: DictationSegment[],
  progress: DictationProgress | null | undefined,
) {
  if (progress?.completedAt) return null;

  return (
    segments.find((segment) => segment.id === progress?.currentSegmentId) ??
    segments[0] ??
    null
  );
}

function getBadgeClassName(state: DictationBadgeState) {
  switch (state) {
    case "green":
      return "relative rounded-lg border border-success-border bg-success-background px-3.5 py-2.5 text-xl leading-none tracking-wider text-success";
    case "yellow":
      return "relative rounded-lg border border-information-border bg-information-background px-3.5 py-2.5 text-xl leading-none tracking-wider text-information";
    case "red":
      return "relative rounded-lg border border-danger-border bg-danger-background px-3.5 py-2.5 text-xl leading-none tracking-wider text-danger";
    default:
      return "relative rounded-lg border border-border bg-[#f0f0f0] px-3.5 py-2.5 text-xl leading-none tracking-wider text-muted-foreground dark:bg-surface";
  }
}

const hintedBadgeClassName =
  "relative rounded-lg border border-warning-border bg-warning-background px-3.5 py-2.5 text-xl leading-none tracking-wider text-warning";

const badgeHoverOverlayClassName =
  "before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:bg-hover-overlay before:opacity-0 before:content-[''] hover:before:opacity-100";

const extraWrongDraftClassName =
  "relative px-3.5 py-2.5 text-xl leading-none tracking-wider text-danger";

function DictationStudySkeleton() {
  return (
    <PageShell>
      <div className="w-full px-4 py-4">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,0.7fr)_minmax(0,0.3fr)]">
          <Skeleton className="aspect-video rounded-lg" />
          <Skeleton className="h-[360px] rounded-lg" />
        </div>
      </div>
    </PageShell>
  );
}

export function DictationStudy({ videoId }: { videoId: string }) {
  const t = useT();
  const { status, user } = useAuthSession();
  const catalogQuery = useDictationCatalogQuery();
  const catalogVideo = useMemo(
    () => findDictationVideo(catalogQuery.data?.catalog.videos ?? [], videoId),
    [catalogQuery.data?.catalog.videos, videoId],
  );
  const videoQuery = useQuery({
    queryKey: getDictationVideoQueryKey(videoId),
    queryFn: ({ signal }) =>
      getDictationVideo(catalogQuery.data!, catalogVideo!, { signal }),
    enabled: Boolean(catalogQuery.data && catalogVideo),
    retry: false,
    refetchOnWindowFocus: false,
  });
  const progressQueryKey = getDictationProgressQueryKey(user?.id ?? null, videoId);
  const progressQuery = useQuery({
    queryKey: progressQueryKey,
    queryFn: () =>
      runAuthenticatedRequest({
        request: (token) => getDictationProgress(token, videoId),
      }),
    enabled: status === "authenticated" && Boolean(user),
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: Infinity,
  });
  const [playRequest, setPlayRequest] = useState(0);
  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(null);
  const [draftSegmentId, setDraftSegmentId] = useState<string | null>(null);
  const [answerInput, setAnswerInput] = useState("");
  const [answeredSegmentIds, setAnsweredSegmentIds] = useState<string[]>([]);
  const [hintedWordIndexes, setHintedWordIndexes] = useState<number[]>([]);
  const hasHydratedProgressRef = useRef(false);
  const submittingSegmentIdsRef = useRef(new Set<string>());

  const progress = progressQuery.data;
  const segments = videoQuery.data?.segments ?? EMPTY_SEGMENTS;
  const progressSegment = getActiveSegment(segments, progress);
  const activeSegment =
    segments.find((segment) => segment.id === selectedSegmentId) ?? progressSegment;
  const activeSegmentId = activeSegment?.id ?? null;
  const isSegmentAnswered = Boolean(
    activeSegmentId && answeredSegmentIds.includes(activeSegmentId),
  );

  const expectedWords = useMemo(
    () => (activeSegment ? getSegmentWords(activeSegment) : []),
    [activeSegment],
  );
  const completedSegmentInput = expectedWords.map((word) => word.raw).join(" ");
  const activeAnswerInput = isSegmentAnswered
    ? completedSegmentInput
    : draftSegmentId === activeSegmentId
      ? answerInput
      : "";
  const activeHintedWordIndexes = draftSegmentId === activeSegmentId
    ? hintedWordIndexes
    : EMPTY_HINTED_WORD_INDEXES;
  const liveEvaluation = useMemo(
    () => evaluateDictationTyping(expectedWords, activeAnswerInput),
    [activeAnswerInput, expectedWords],
  );
  const badgeStates = isSegmentAnswered
    ? expectedWords.map(() => "green" as const)
    : liveEvaluation.badgeStates;
  const wrongDrafts = isSegmentAnswered ? [] : liveEvaluation.wrongDrafts;
  const yellowDrafts = isSegmentAnswered ? [] : liveEvaluation.yellowDrafts;
  const extraWrongDrafts = isSegmentAnswered ? [] : liveEvaluation.extraWrongDrafts;

  useLayoutEffect(() => {
    if (hasHydratedProgressRef.current || !progressQuery.isFetched) return;

    hasHydratedProgressRef.current = true;
    setAnsweredSegmentIds(progressQuery.data?.answeredSegmentIds ?? []);
  }, [progressQuery.data?.answeredSegmentIds, progressQuery.isFetched]);

  function revealWordHint(index: number) {
    if (isSegmentAnswered || !activeSegmentId) return;
    if (badgeStates[index] === "green") return;

    setDraftSegmentId(activeSegmentId);
    setHintedWordIndexes((current) =>
      current.includes(index) ? current : [...current, index],
    );
  }

  useEffect(() => {
    if (
      !activeSegment ||
      !liveEvaluation.allMatched ||
      answeredSegmentIds.includes(activeSegment.id) ||
      submittingSegmentIdsRef.current.has(activeSegment.id) ||
      status !== "authenticated"
    ) {
      return;
    }

    const segmentId = activeSegment.id;
    submittingSegmentIdsRef.current.add(segmentId);
    setAnsweredSegmentIds((current) =>
      current.includes(segmentId) ? current : [...current, segmentId],
    );
    setSelectedSegmentId(segmentId);
    setDraftSegmentId(segmentId);
    setAnswerInput(completedSegmentInput);
    setHintedWordIndexes([]);

    const segmentIndex = segments.findIndex((segment) => segment.id === segmentId);
    const nextSegmentId =
      segmentIndex >= 0 && segmentIndex < segments.length - 1
        ? segments[segmentIndex + 1]!.id
        : null;

    void runAuthenticatedRequest({
      request: (token) =>
        submitDictationAnswer(token, {
          videoId,
          segmentId,
          nextSegmentId,
        }),
    })
      .catch(() => {
        setAnsweredSegmentIds((current) =>
          current.filter((id) => id !== segmentId),
        );
      })
      .finally(() => {
        submittingSegmentIdsRef.current.delete(segmentId);
      });
  }, [
    activeSegment,
    answeredSegmentIds,
    completedSegmentInput,
    expectedWords,
    liveEvaluation.allMatched,
    segments,
    status,
    videoId,
  ]);

  if (catalogQuery.isLoading || videoQuery.isLoading || progressQuery.isLoading) {
    return <DictationStudySkeleton />;
  }

  const loadError =
    catalogQuery.error || videoQuery.error
      ? t("dictation.lessonNotFound")
      : progressQuery.error
        ? t("dictation.progressLoadError")
        : null;

  if (!catalogVideo || !videoQuery.data || loadError) {
    return (
      <PageShell>
        <div className="w-full px-4 py-4">
          <div>
            <Link className={dictationBackButtonClassName} href="/dictation">
              {t("dictation.back")}
            </Link>
            <p className="mt-8 text-sm text-muted-foreground">{loadError ?? t("dictation.lessonNotFound")}</p>
          </div>
        </div>
      </PageShell>
    );
  }

  function selectSegment(segment: DictationSegment) {
    setSelectedSegmentId(segment.id);
    setDraftSegmentId(null);
    setAnswerInput("");
    setHintedWordIndexes([]);
    setPlayRequest((value) => value + 1);
  }

  return (
    <PageShell className="lg:overflow-y-hidden">
      <div className="w-full py-4 pl-4 lg:flex lg:min-h-0 lg:flex-1 lg:flex-col">
        <div className="mb-4 flex shrink-0 items-center gap-4">
          <Link className={dictationBackButtonClassName} href="/dictation">
            {t("dictation.back")}
          </Link>
          <h1 className="min-w-0 truncate text-lg font-semibold text-foreground">
            {videoQuery.data.video.title}
          </h1>
        </div>

        <DictationSplitLayout
          left={
            <DictationHorizontalSplitLayout
              top={
                <YouTubeSegmentPlayer
                  onError={noop}
                  onReady={noop}
                  playRequest={playRequest}
                  segment={activeSegment}
                  videoId={videoQuery.data.video.youtubeVideoId}
                />
              }
              bottom={
                <div>
                  <input
                  autoComplete="off"
                  className={classNames(
                    "w-full rounded-lg border border-border bg-surface px-4 py-3 text-base outline-none placeholder:text-muted-foreground focus:border-primary dark:bg-[#000000]",
                    isSegmentAnswered
                      ? "cursor-default text-success"
                      : "text-foreground",
                  )}
                  id="dictation-answer"
                  name="dictation-answer"
                    onChange={(event) => {
                    if (!isSegmentAnswered) {
                      setDraftSegmentId(activeSegmentId);
                      setAnswerInput(event.target.value);
                    }
                  }}
                  placeholder={t("dictation.typeWhatYouHear")}
                  readOnly={isSegmentAnswered}
                  type="text"
                  value={activeAnswerInput}
                />
                  {expectedWords.length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                    {extraWrongDrafts
                      .filter((draft) => draft.afterBadgeIndex < 0)
                      .map((draft, draftIndex) => (
                        <span
                          aria-hidden
                          className={extraWrongDraftClassName}
                          key={`extra-before-${draftIndex}-${draft.text}`}
                        >
                          <span className="text-base leading-6 tracking-normal line-through">
                            {draft.text}
                          </span>
                        </span>
                      ))}
                    {expectedWords.map((word, index) => {
                      const state = badgeStates[index] ?? "idle";
                      const isHinted = activeHintedWordIndexes.includes(index);
                      const isGreen = state === "green";
                      const wrongDraft = wrongDrafts.find((draft) => draft.index === index);
                      const yellowDraft = yellowDrafts.find((draft) => draft.index === index);
                      const canHint = !isSegmentAnswered && !isGreen;
                      const badgeClassName = isGreen
                        ? getBadgeClassName("green")
                        : isHinted
                          ? hintedBadgeClassName
                          : getBadgeClassName(state);

                      return (
                        <span className="contents" key={`${word.raw}-${index}`}>
                          <button
                            aria-label={word.raw}
                            className={classNames(
                              badgeClassName,
                              "disabled:opacity-100",
                              canHint && "cursor-pointer",
                              canHint && badgeHoverOverlayClassName,
                              !canHint && "cursor-default",
                            )}
                            disabled={!canHint}
                            onClick={() => revealWordHint(index)}
                            type="button"
                          >
                            {isGreen ? (
                              <>
                                <span className="invisible relative z-10 text-xl leading-6 tracking-widest">
                                  {"•".repeat(Math.max(1, word.normalized.length))}
                                </span>
                                <span className="absolute inset-0 z-10 flex items-center justify-center text-base leading-6 tracking-normal">
                                  {word.raw}
                                </span>
                              </>
                            ) : isHinted ? (
                              <>
                                <span className="invisible relative z-10 text-xl leading-6 tracking-widest">
                                  {"•".repeat(Math.max(1, word.normalized.length))}
                                </span>
                                <span className="absolute inset-0 z-10 flex items-center justify-center text-base leading-6 tracking-normal">
                                  {word.raw}
                                </span>
                              </>
                            ) : wrongDraft ? (
                              <span className="relative z-10 text-base leading-6 tracking-normal line-through">
                                {wrongDraft.text}
                              </span>
                            ) : yellowDraft ? (
                              <span className="relative z-10 inline-flex items-center">
                                <span className="text-base leading-6 tracking-normal">
                                  {yellowDraft.prefix}
                                </span>
                                <span className="text-xl leading-6 tracking-widest">
                                  {"•".repeat(
                                    Math.max(
                                      0,
                                      word.normalized.length - yellowDraft.matchedLength,
                                    ),
                                  )}
                                </span>
                              </span>
                            ) : (
                              <span className="relative z-10 text-xl leading-6 tracking-widest">
                                {"•".repeat(Math.max(1, word.normalized.length))}
                              </span>
                            )}
                          </button>
                          {extraWrongDrafts
                            .filter((draft) => draft.afterBadgeIndex === index)
                            .map((draft, draftIndex) => (
                              <span
                                aria-hidden
                                className={extraWrongDraftClassName}
                                key={`extra-after-${index}-${draftIndex}-${draft.text}`}
                              >
                                <span className="text-base leading-6 tracking-normal line-through">
                                  {draft.text}
                                </span>
                              </span>
                            ))}
                        </span>
                      );
                    })}
                    </div>
                  ) : null}
                </div>
              }
            />
          }
          right={
            <DictationSegmentNavigation
              activeSegmentId={activeSegment?.id ?? null}
              activeVideoId={videoId}
              answeredSegmentIds={answeredSegmentIds}
              disabled={false}
              onSelect={selectSegment}
              segments={videoQuery.data.segments}
              videos={catalogQuery.data?.catalog.videos ?? []}
            />
          }
        />
      </div>
    </PageShell>
  );
}
