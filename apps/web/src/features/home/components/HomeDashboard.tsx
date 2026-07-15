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
          <section
            aria-label="Learning overview"
            className="grid gap-4 lg:grid-cols-12 lg:gap-5"
          >
            <NextActionCard nextAction={nextAction} />
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
          </section>
        )}
      </div>
    </PageShell>
  );
}

function NextActionCard({
  nextAction,
}: {
  nextAction: ReturnType<typeof getDashboardNextAction>;
}) {
  return (
    <article className="flex min-h-60 flex-col rounded-2xl border border-border bg-muted p-6 sm:p-7 lg:col-span-5">
      <p className="text-sm font-medium text-muted-foreground">Next</p>
      <h2 className="mt-3 max-w-md text-2xl font-semibold leading-tight tracking-tight text-balance sm:text-3xl">
        {nextAction.title}
      </h2>
      <Link
        className={primaryTextButtonClassName(
          dashboardButtonInteractionClassName,
          "mt-auto self-start pt-6",
        )}
        href={nextAction.href}
      >
        {nextAction.label}
        <ArrowForwardIcon />
      </Link>
    </article>
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
      className="flex min-h-60 flex-col rounded-2xl border border-border bg-surface p-6 sm:p-7 lg:col-span-3"
    >
      <p className="text-sm font-medium text-muted-foreground">Vocabulary</p>
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
        <div className="mt-7 border-l-2 border-border pl-4">
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
          <dl className="mt-8 grid grid-cols-2 gap-4">
            <Metric
              label="Mastery"
              value={`${masteryPercentage}%`}
            />
            <Metric
              label="Difficult"
              value={stats.highWrongCount}
            />
          </dl>

          <div className="mt-auto pt-6">
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
      className="flex min-h-60 flex-col rounded-2xl border border-border bg-surface p-6 sm:p-7 lg:col-span-4"
    >
      <p className="text-sm font-medium text-muted-foreground">TOEIC</p>
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
        <div className="mt-7 border-l-2 border-border pl-4">
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
          <dl className="mt-8 grid grid-cols-2 gap-4">
            <Metric
              label="Accuracy"
              value={
                partPractice.accuracy == null
                  ? "-"
                  : `${partPractice.accuracy}%`
              }
            />
            <Metric
              label="Answered"
              value={`${partPractice.answered}/${partPractice.total}`}
            />
          </dl>

          <div className="mt-6">
            {partPractice.attentionPart ? (
              <p className="text-sm text-muted-foreground">
                Focus: Part {partPractice.attentionPart.partNumber}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                {partPractice.answered > 0 ? "No focus part" : "Start a part"}
              </p>
            )}
          </div>

          <div className="mt-auto pt-6">
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
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <div>
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="mt-1">
        <span className="block font-mono text-3xl font-semibold tracking-tight tabular-nums">
          {value}
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
