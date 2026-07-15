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
import { classNames } from "@/shared/lib/classNames";
import {
  primaryTextButtonClassName,
  secondaryTextButtonClassName,
} from "@/shared/ui/button";
import { ArrowForwardIcon } from "@/shared/ui/icons/ArrowForwardIcon";
import { CheckIcon } from "@/shared/ui/icons/CheckIcon";
import { ReviewNavIcon } from "@/shared/ui/icons/ReviewNavIcon";
import { TestsNavIcon } from "@/shared/ui/icons/TestsNavIcon";
import { WrongIcon } from "@/shared/ui/icons/WrongIcon";
import { PageShell } from "@/shared/ui/PageShell";
import { statusColorClasses } from "@/shared/ui/theme/statusColors";

const dashboardButtonInteractionClassName =
  "gap-2 transition duration-200 ease-out hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:translate-y-px [&_svg]:size-5 [&_svg]:shrink-0";

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
        <section className="w-full max-w-xl rounded-3xl bg-surface p-6 shadow-card sm:p-8">
          <p className="mb-3 text-sm font-medium text-muted-foreground">
            EngVocab
          </p>
          <h1 className="max-w-lg text-3xl font-semibold leading-tight tracking-tight text-balance sm:text-4xl">
            A calmer way to build your English every day.
          </h1>
          <p className="mt-4 max-w-lg leading-7 text-muted-foreground">
            Sign in to review due vocabulary, practice TOEIC, and keep your next
            study step clear.
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
  const suggestedFocus = partPracticeError
    ? "—"
    : partPractice.suggestedPartNumber
      ? `Part ${partPractice.suggestedPartNumber}`
      : "Choose a part";

  return (
    <PageShell>
      <div className="mx-auto w-full max-w-6xl px-4 pb-12 pt-6 sm:px-6 sm:pt-8 lg:px-8 lg:pb-16">
        <header className="mb-7 sm:mb-9">
          <p className="text-sm font-medium text-muted-foreground">Dashboard</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            Welcome back, {displayName}
          </h1>
          <p className="mt-3 max-w-2xl leading-7 text-muted-foreground text-pretty">
            Keep the next step small and clear. Your current review and Part
            Practice progress are gathered here.
          </p>
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
          <div className="flex flex-col gap-5 sm:gap-6">
            <article className="relative overflow-hidden rounded-[1.75rem] bg-amber-100/80 p-5 text-amber-950 dark:bg-amber-950/40 dark:text-amber-50 sm:p-7 lg:grid lg:grid-cols-[minmax(0,1.35fr)_minmax(16rem,0.65fr)] lg:gap-8">
              <div
                aria-hidden
                className="absolute -right-16 -top-20 size-56 rounded-full border-[2.5rem] border-amber-200/60 dark:border-amber-800/20"
              />
              <div className="relative max-w-2xl">
                <p className="text-sm font-semibold">Next up</p>
                <h2 className="mt-3 text-2xl font-semibold leading-tight tracking-tight text-balance sm:text-3xl">
                  {nextAction.title}
                </h2>
                <p className="mt-3 max-w-xl leading-7 text-amber-950/70 text-pretty dark:text-amber-100/70">
                  {nextAction.description}
                </p>
                <Link
                  className={primaryTextButtonClassName(
                    dashboardButtonInteractionClassName,
                    "mt-6 border-amber-950 bg-amber-950 text-amber-50 dark:border-amber-50 dark:bg-amber-50 dark:text-amber-950",
                  )}
                  href={nextAction.href}
                >
                  {nextAction.label}
                  <ArrowForwardIcon />
                </Link>
              </div>

              <div className="relative mt-7 rounded-2xl bg-surface/75 p-4 text-foreground shadow-sm backdrop-blur-sm lg:mt-0 lg:self-stretch">
                <p className="text-sm font-medium text-muted-foreground">
                  Current queue
                </p>
                <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-5">
                  <Metric
                    label="Vocabulary due"
                    value={vocabError ? "—" : (stats?.due ?? 0)}
                  />
                  <Metric
                    label="Part mistakes"
                    value={partPracticeError ? "—" : partPractice.wrong}
                  />
                  <Metric
                    className="col-span-2 border-t border-border pt-4"
                    label="Suggested focus"
                    value={suggestedFocus}
                  />
                </dl>
              </div>
            </article>

            <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)] lg:gap-6">
              <VocabularyOverview
                collectionName={defaultCollection.name}
                error={vocabError}
                onRetry={() => void reloadVocab()}
                stats={stats}
              />
              <PartPracticeOverview
                error={partPracticeError}
                onRetry={() => void reloadPartPractice()}
                partPractice={partPractice}
                hasSummaries={summaries.length > 0}
              />
            </div>

          </div>
        )}
      </div>
    </PageShell>
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
      className="rounded-[1.5rem] bg-surface p-5 shadow-card sm:p-6"
    >
      <div className="flex items-start gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-amber-100 text-amber-950 dark:bg-amber-950/50 dark:text-amber-100">
          <ReviewNavIcon className="size-6" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-medium text-muted-foreground">
            Vocabulary · default collection
          </p>
          <h2
            className="mt-0.5 truncate text-xl font-semibold tracking-tight"
            id="vocabulary-overview-title"
          >
            {collectionName}
          </h2>
        </div>
      </div>

      {error ? (
        <InlinePanelState
          actionLabel="Retry vocabulary"
          message={error}
          onAction={onRetry}
        />
      ) : !stats || stats.total === 0 ? (
        <div className="mt-7 rounded-2xl bg-muted p-5">
          <p className="font-semibold">No vocabulary items yet</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Add words to this collection and your review progress will appear
            here.
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
          <div className="mt-7 flex items-end justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Ready to review</p>
              <p className="mt-1 font-mono text-4xl font-semibold tracking-tight tabular-nums">
                {stats.due}
              </p>
            </div>
            <p className="pb-1 text-right text-sm text-muted-foreground">
              {masteryPercentage}% mastered
            </p>
          </div>

          <ProgressTrack
            label={`${stats.mastered} of ${stats.total} vocabulary items mastered`}
            value={masteryPercentage}
          />

          <dl className="mt-6 grid grid-cols-3 gap-3 border-t border-border pt-5">
            <Metric label="Study items" value={stats.total} />
            <Metric
              label="Mastered"
              value={stats.mastered}
              valueClassName={statusColorClasses.success.text}
            />
            <Metric
              label="Needs attention"
              value={stats.highWrongCount}
              valueClassName={
                stats.highWrongCount > 0
                  ? statusColorClasses.danger.text
                  : undefined
              }
            />
          </dl>

          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              className={primaryTextButtonClassName(
                dashboardButtonInteractionClassName,
              )}
              href="/review"
            >
              {stats.due > 0 ? "Review due items" : "Open review queue"}
              <ArrowForwardIcon />
            </Link>
            <Link
              className={secondaryTextButtonClassName(
                dashboardButtonInteractionClassName,
              )}
              href={getCollectionsListPath("user")}
            >
              Manage
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
  const answeredPercentage = partPractice.total
    ? Math.round((partPractice.answered / partPractice.total) * 100)
    : 0;

  return (
    <section
      aria-labelledby="part-practice-overview-title"
      className="rounded-[1.5rem] bg-surface p-5 shadow-card sm:p-6"
    >
      <div className="flex items-start gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-sky-100 text-sky-800 dark:bg-sky-950/50 dark:text-sky-200">
          <TestsNavIcon className="size-6" />
        </span>
        <div>
          <p className="text-sm font-medium text-muted-foreground">TOEIC</p>
          <h2
            className="mt-0.5 text-xl font-semibold tracking-tight"
            id="part-practice-overview-title"
          >
            Part Practice
          </h2>
        </div>
      </div>

      {error ? (
        <InlinePanelState
          actionLabel="Retry Part Practice"
          message={error}
          onAction={onRetry}
        />
      ) : !hasSummaries ? (
        <div className="mt-7 rounded-2xl bg-muted p-5">
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
          <div className="mt-7 flex items-end justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Current accuracy</p>
              <p className="mt-1 font-mono text-4xl font-semibold tracking-tight tabular-nums">
                {partPractice.accuracy == null ? "—" : `${partPractice.accuracy}%`}
              </p>
            </div>
            <p className="pb-1 text-right text-sm text-muted-foreground">
              {partPractice.answered} of {partPractice.total} answered
            </p>
          </div>

          <ProgressTrack
            label={`${partPractice.answered} of ${partPractice.total} Part Practice questions answered`}
            value={answeredPercentage}
          />

          {partPractice.attentionPart ? (
            <div className="mt-6 rounded-2xl bg-red-50/80 p-4 dark:bg-red-950/25">
              <div className="flex items-start gap-3">
                <WrongIcon
                  className={classNames(
                    "mt-0.5 size-5 shrink-0",
                    statusColorClasses.danger.text,
                  )}
                />
                <div>
                  <p className="font-semibold">
                    Part {partPractice.attentionPart.partNumber} needs attention
                  </p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    {partPractice.attentionPart.wrong} wrong out of{" "}
                    {partPractice.attentionPart.answered} answered in this part.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-6 rounded-2xl bg-emerald-50/80 p-4 dark:bg-emerald-950/25">
              <div className="flex items-start gap-3">
                <CheckIcon
                  className={classNames(
                    "mt-0.5 size-5 shrink-0",
                    statusColorClasses.success.text,
                  )}
                />
                <div>
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
                </div>
              </div>
            </div>
          )}

          <dl className="mt-6 grid grid-cols-2 gap-3 border-t border-border pt-5">
            <Metric
              label="Correct"
              value={partPractice.correct}
              valueClassName={statusColorClasses.success.text}
            />
            <Metric
              label="Wrong"
              value={partPractice.wrong}
              valueClassName={
                partPractice.wrong > 0
                  ? statusColorClasses.danger.text
                  : undefined
              }
            />
          </dl>

          <Link
            className={primaryTextButtonClassName(
              dashboardButtonInteractionClassName,
              "mt-7",
            )}
            href="/tests"
          >
            Open Part Practice
            <ArrowForwardIcon />
          </Link>
        </>
      )}
    </section>
  );
}

function ProgressTrack({ label, value }: { label: string; value: number }) {
  return (
    <div
      aria-label={label}
      aria-valuemax={100}
      aria-valuemin={0}
      aria-valuenow={value}
      className="mt-4 h-2 overflow-hidden rounded-full bg-muted"
      role="progressbar"
    >
      <div
        className="h-full rounded-full bg-foreground transition-[width] duration-500"
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

function Metric({
  className,
  label,
  value,
  valueClassName,
}: {
  className?: string;
  label: string;
  value: number | string;
  valueClassName?: string;
}) {
  return (
    <div className={className}>
      <dt className="text-xs leading-5 text-muted-foreground">{label}</dt>
      <dd
        className={classNames(
          "mt-1 font-mono text-xl font-semibold tracking-tight tabular-nums",
          valueClassName,
        )}
      >
        {value}
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
    <div className="mt-7 rounded-2xl bg-muted p-5" role="alert">
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
      className="flex flex-col items-start justify-between gap-5 rounded-3xl bg-surface p-6 text-muted-foreground shadow-card sm:flex-row sm:items-center sm:p-8"
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
