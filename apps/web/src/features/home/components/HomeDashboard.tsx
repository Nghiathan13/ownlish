"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import type { VocabStats } from "@/entities/vocab/api/vocab";
import {
  getCollectionsListPath,
  getDefaultUserCollection,
} from "@/entities/collection/lib/collectionDisplay";
import { SessionLoadingSkeleton } from "@/features/auth/components/SessionLoadingSkeleton";
import {
  isAuthenticatedStatus,
  isLoadingStatus,
  useAuthSession,
} from "@/features/auth/hooks/useAuthSession";
import { useCollectionsListQuery } from "@/features/collections/shared/data/hooks";
import { HomeDashboardSkeleton } from "@/features/home/components/HomeDashboardSkeleton";
import { useDashboardPartPractice } from "@/features/home/hooks/useDashboardPartPractice";
import { useVocabStats } from "@/features/home/hooks/useVocabStats";
import {
  buildPartPracticeSummary,
  getDashboardNextAction,
  getMasteryPercentage,
  type DashboardPartPracticeSummary,
} from "@/features/home/lib/dashboardSummary";
import {
  primaryTextButtonClassName,
  secondaryTextButtonClassName,
} from "@/shared/ui/button";
import { ArrowForwardIcon } from "@/shared/ui/icons/ArrowForwardIcon";
import { PageShell } from "@/shared/ui/PageShell";

const dashboardButtonInteractionClassName =
  "gap-2 whitespace-nowrap transition duration-200 ease-out hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:translate-y-px [&_svg]:size-5 [&_svg]:shrink-0";

export function HomeDashboard() {
  const { status, user } = useAuthSession();
  const isAuthenticated = isAuthenticatedStatus(status);
  const {
    collections,
    collectionsError,
    isLoadingCollections,
    reloadCollections,
  } = useCollectionsListQuery({
    isAuthenticated,
    userId: user?.id ?? null,
  });
  const defaultCollection = getDefaultUserCollection(collections);
  const {
    error: vocabError,
    isLoading: isLoadingVocab,
    reload: reloadVocab,
    stats,
  } = useVocabStats({
    collectionId: defaultCollection?.id ?? null,
    isAuthenticated,
    userId: user?.id ?? null,
  });
  const {
    error: partPracticeError,
    isLoading: isLoadingPartPractice,
    reload: reloadPartPractice,
    summaries,
  } = useDashboardPartPractice({
    isAuthenticated,
    userId: user?.id ?? null,
  });

  if (isLoadingStatus(status)) {
    return <SessionLoadingSkeleton centered />;
  }

  if (!isAuthenticated) {
    return (
      <PageShell centered className="px-4 py-8">
        <section className="w-full max-w-xl rounded-2xl border border-border bg-surface p-6 sm:p-8">
          <p className="text-sm font-medium text-muted-foreground">EngVocab</p>
          <h1 className="mt-3 max-w-lg text-3xl font-semibold leading-tight tracking-tight text-balance sm:text-4xl">
            Build your English with a clear daily routine.
          </h1>
          <p className="mt-4 max-w-lg leading-7 text-muted-foreground">
            Sign in to review vocabulary and continue your TOEIC practice.
          </p>
          <Link
            className={primaryTextButtonClassName(
              dashboardButtonInteractionClassName,
              "mt-7",
            )}
            href="/login"
          >
            Sign in
            <ArrowForwardIcon />
          </Link>
        </section>
      </PageShell>
    );
  }

  const partPractice = buildPartPracticeSummary(summaries);
  const nextAction = getDashboardNextAction({ partPractice, stats });
  const displayName = getDisplayName(user?.name, user?.email);

  return (
    <PageShell>
      <div className="mx-auto w-full max-w-6xl px-4 pb-12 pt-7 sm:px-6 sm:pt-9 lg:px-8 lg:pb-16">
        <header className="mb-6 sm:mb-8">
          <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            Welcome back, {displayName}
          </h1>
        </header>

        {isLoadingCollections ? (
          <HomeDashboardSkeleton />
        ) : collectionsError ? (
          <DashboardMessage role="alert">
            <div>
              <p className="font-semibold text-foreground">
                We couldn&apos;t load your collections.
              </p>
              <p className="mt-1 text-sm">{collectionsError}</p>
            </div>
            <button
              className={secondaryTextButtonClassName(
                dashboardButtonInteractionClassName,
              )}
              onClick={() => void reloadCollections()}
              type="button"
            >
              Try again
            </button>
          </DashboardMessage>
        ) : !defaultCollection ? (
          <DashboardMessage>
            <div className="max-w-xl">
              <p className="font-semibold text-foreground">
                Set up your vocabulary space
              </p>
              <p className="mt-1 text-sm leading-6">
                Choose or create a personal collection before tracking your
                vocabulary progress here.
              </p>
            </div>
            <Link
              className={primaryTextButtonClassName(
                dashboardButtonInteractionClassName,
              )}
              href={getCollectionsListPath("user")}
            >
              Browse collections
              <ArrowForwardIcon />
            </Link>
          </DashboardMessage>
        ) : isLoadingVocab || isLoadingPartPractice ? (
          <HomeDashboardSkeleton />
        ) : (
          <div className="flex flex-col gap-9 sm:gap-11">
            <section className="overflow-hidden rounded-2xl border border-border bg-surface">
              <div className="grid lg:grid-cols-[minmax(0,1.35fr)_minmax(19rem,0.65fr)]">
                <article className="bg-sky-50/70 p-5 dark:bg-sky-950/20 sm:p-7 lg:p-8">
                  <p className="text-sm font-medium text-sky-800 dark:text-sky-300">
                    Next up
                  </p>
                  <h2 className="mt-3 max-w-2xl text-2xl font-semibold leading-tight tracking-tight text-balance sm:text-3xl">
                    {nextAction.title}
                  </h2>
                  <p className="mt-3 max-w-xl leading-7 text-muted-foreground text-pretty">
                    {nextAction.description}
                  </p>
                  <Link
                    className={primaryTextButtonClassName(
                      dashboardButtonInteractionClassName,
                      "mt-6",
                    )}
                    href={nextAction.href}
                  >
                    {nextAction.label}
                    <ArrowForwardIcon />
                  </Link>
                </article>

                <LearningRhythm />
              </div>
            </section>

            <section aria-labelledby="learning-progress-title">
              <div className="mb-4 max-w-2xl">
                <h2
                  className="text-xl font-semibold tracking-tight sm:text-2xl"
                  id="learning-progress-title"
                >
                  Learning progress
                </h2>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Vocabulary uses your default collection. TOEIC reflects Part
                  Practice only.
                </p>
              </div>

              <div className="overflow-hidden rounded-2xl border border-border bg-surface divide-y divide-border lg:grid lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:divide-x lg:divide-y-0">
                <VocabularyOverview
                  collectionName={defaultCollection.name}
                  error={vocabError}
                  onRetry={() => void reloadVocab()}
                  stats={stats}
                />
                <PartPracticeOverview
                  error={partPracticeError}
                  hasSummaries={summaries.length > 0}
                  onRetry={() => void reloadPartPractice()}
                  partPractice={partPractice}
                />
              </div>
            </section>
          </div>
        )}
      </div>
    </PageShell>
  );
}

function LearningRhythm() {
  return (
    <aside
      aria-labelledby="learning-rhythm-title"
      className="border-t border-border p-5 sm:p-7 lg:border-l lg:border-t-0 lg:p-8"
    >
      <h2 className="font-semibold" id="learning-rhythm-title">
        Learning rhythm
      </h2>

      <div className="mt-4 divide-y divide-border">
        <section
          aria-labelledby="study-time-title"
          className="pb-4"
        >
          <h3 className="text-sm text-muted-foreground" id="study-time-title">
            Study time
          </h3>
          <p className="mt-1 text-lg font-semibold">Not tracked yet</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Daily and weekly totals
          </p>
        </section>

        <section
          aria-labelledby="learning-streak-title"
          className="pt-4"
        >
          <h3
            className="text-sm text-muted-foreground"
            id="learning-streak-title"
          >
            Learning streak
          </h3>
          <p className="mt-1 text-lg font-semibold">Not tracked yet</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Consecutive study days
          </p>
        </section>
      </div>
    </aside>
  );
}

function VocabularyOverview({
  collectionName,
  error,
  onRetry,
  stats,
}: {
  collectionName: string;
  error: string | null;
  onRetry: () => void;
  stats: VocabStats | null;
}) {
  const masteryPercentage = getMasteryPercentage(stats);

  return (
    <section
      aria-labelledby="vocabulary-overview-title"
      className="flex flex-col p-5 sm:p-7"
    >
      <p className="text-sm font-medium text-sky-800 dark:text-sky-300">
        Vocabulary
      </p>
      <h3
        className="mt-1 truncate text-xl font-semibold tracking-tight"
        id="vocabulary-overview-title"
      >
        {collectionName}
      </h3>

      {error ? (
        <InlinePanelState
          actionLabel="Retry vocabulary"
          message={error}
          onAction={onRetry}
        />
      ) : !stats || stats.total === 0 ? (
        <div className="mt-7 border-l-2 border-sky-600 pl-4 dark:border-sky-400">
          <p className="font-semibold">No vocabulary items yet</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Add words to this collection to start tracking mastery.
          </p>
          <Link
            className={secondaryTextButtonClassName(
              dashboardButtonInteractionClassName,
              "mt-4",
            )}
            href={getCollectionsListPath("user")}
          >
            Browse collections
            <ArrowForwardIcon />
          </Link>
        </div>
      ) : (
        <>
          <dl className="mt-8 grid grid-cols-2 gap-6">
            <Metric
              detail={`${stats.mastered} of ${stats.total} items`}
              label="Mastery"
              value={`${masteryPercentage}%`}
            />
            <Metric
              detail="High mistake count"
              label="Needs attention"
              value={stats.highWrongCount}
            />
          </dl>

          <div className="mt-8 lg:mt-auto lg:pt-8">
            <Link
              className={secondaryTextButtonClassName(
                dashboardButtonInteractionClassName,
              )}
              href={getCollectionsListPath("user")}
            >
              Manage collection
              <ArrowForwardIcon />
            </Link>
          </div>
        </>
      )}
    </section>
  );
}

function PartPracticeOverview({
  error,
  hasSummaries,
  onRetry,
  partPractice,
}: {
  error: string | null;
  hasSummaries: boolean;
  onRetry: () => void;
  partPractice: DashboardPartPracticeSummary;
}) {
  return (
    <section
      aria-labelledby="part-practice-overview-title"
      className="flex flex-col p-5 sm:p-7"
    >
      <p className="text-sm font-medium text-sky-800 dark:text-sky-300">
        TOEIC
      </p>
      <h3
        className="mt-1 text-xl font-semibold tracking-tight"
        id="part-practice-overview-title"
      >
        Part Practice
      </h3>

      {error ? (
        <InlinePanelState
          actionLabel="Retry Part Practice"
          message={error}
          onAction={onRetry}
        />
      ) : !hasSummaries ? (
        <div className="mt-7 border-l-2 border-sky-600 pl-4 dark:border-sky-400">
          <p className="font-semibold">Part Practice is not available yet</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Open Tests to check the available TOEIC practice material.
          </p>
          <Link
            className={secondaryTextButtonClassName(
              dashboardButtonInteractionClassName,
              "mt-4",
            )}
            href="/tests"
          >
            Open Tests
            <ArrowForwardIcon />
          </Link>
        </div>
      ) : (
        <>
          <dl className="mt-8 grid grid-cols-2 gap-6">
            <Metric
              detail={`${partPractice.correct} correct of ${partPractice.answered} answered`}
              label="Accuracy"
              value={
                partPractice.accuracy == null
                  ? "Not started"
                  : `${partPractice.accuracy}%`
              }
            />
            <Metric
              detail={`of ${partPractice.total} questions`}
              label="Answered"
              value={partPractice.answered}
            />
          </dl>

          <div className="mt-7 border-l-2 border-sky-600 pl-4 dark:border-sky-400">
            {partPractice.attentionPart ? (
              <>
                <p className="text-sm text-muted-foreground">Focus next</p>
                <p className="mt-1 font-semibold">
                  Part {partPractice.attentionPart.partNumber} needs attention
                </p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  {partPractice.attentionPart.wrong} mistakes in{" "}
                  {partPractice.attentionPart.answered} answered questions.
                </p>
              </>
            ) : (
              <>
                <p className="font-semibold">
                  {partPractice.answered > 0
                    ? "No mistakes waiting for review"
                    : "Ready for your first practice"}
                </p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  {partPractice.answered > 0
                    ? "Choose another part when you are ready to continue."
                    : "Start with one part and build from there."}
                </p>
              </>
            )}
          </div>

          <div className="mt-8 lg:mt-auto lg:pt-8">
            <Link
              className={primaryTextButtonClassName(
                dashboardButtonInteractionClassName,
              )}
              href="/tests"
            >
              Open Part Practice
              <ArrowForwardIcon />
            </Link>
          </div>
        </>
      )}
    </section>
  );
}

function Metric({
  detail,
  label,
  value,
}: {
  detail: string;
  label: string;
  value: number | string;
}) {
  return (
    <div>
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="mt-1">
        <span className="block font-mono text-3xl font-semibold tracking-tight tabular-nums sm:text-4xl">
          {value}
        </span>
        <span className="mt-2 block text-xs leading-5 text-muted-foreground">
          {detail}
        </span>
      </dd>
    </div>
  );
}

function InlinePanelState({
  actionLabel,
  message,
  onAction,
}: {
  actionLabel: string;
  message: string;
  onAction: () => void;
}) {
  return (
    <div className="mt-7 border-l-2 border-border pl-4" role="alert">
      <p className="font-semibold text-foreground">This section did not load.</p>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{message}</p>
      <button
        className={secondaryTextButtonClassName(
          dashboardButtonInteractionClassName,
          "mt-4",
        )}
        onClick={onAction}
        type="button"
      >
        {actionLabel}
      </button>
    </div>
  );
}

function DashboardMessage({
  children,
  role,
}: {
  children: ReactNode;
  role?: "alert";
}) {
  return (
    <section
      className="flex flex-col items-start justify-between gap-5 rounded-2xl border border-border bg-surface p-6 text-muted-foreground sm:flex-row sm:items-center sm:p-8"
      role={role}
    >
      {children}
    </section>
  );
}

function getDisplayName(name: string | null | undefined, email?: string) {
  const trimmedName = name?.trim();

  if (trimmedName) {
    return trimmedName.split(/\s+/)[0];
  }

  return email?.split("@")[0] || "there";
}
