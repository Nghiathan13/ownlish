"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import type { PartPracticePartSummary } from "@/entities/toeic/api/types";
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
import { GuestLanding } from "@/features/home/components/GuestLanding";
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
      <PageShell className="overflow-visible">
        <GuestLanding />
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="flex flex-col gap-4 px-8 py-8 lg:gap-8 lg:px-16">
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
          <div className="flex flex-col gap-8">
            <VocabularyOverview
              error={vocabError}
              onRetry={() => void reloadVocab()}
              stats={stats}
            />
            <PartPracticeOverview
              error={partPracticeError}
              onRetry={() => void reloadPartPractice()}
              summaries={summaries}
            />
          </div>
        )}
      </div>
    </PageShell>
  );
}

function VocabularyOverview({
  error,
  onRetry,
  stats,
}: {
  error: string | null;
  onRetry: () => void;
  stats: VocabStats | null;
}) {
  return (
    <section aria-labelledby="vocabulary-title">
      <div className="flex items-center mb-8 gap-4">
        <span className="h-px flex-1 bg-border" />
        <h1
          className="text-2xl font-semibold tracking-tight sm:text-3xl"
          id="vocabulary-title"
        >
          Vocabulary
        </h1>
        <span className="h-px flex-1 bg-border" />
      </div>
      {error ? (
        <InlinePanelState
          actionLabel="Retry vocabulary"
          message={error}
          onAction={onRetry}
        />
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:gap-8 min-[1481px]:grid-cols-4">
          <MetricCard label="Study time" value="-" />
          <MetricCard label="Due for review" value={stats?.due ?? 0} />
          <MetricCard label="Mastered" value={stats?.mastered ?? 0} />
          <MetricCard label="Difficult" value={stats?.highWrongCount ?? 0} />
        </div>
      )}
    </section>
  );
}

function PartPracticeOverview({
  error,
  onRetry,
  summaries,
}: {
  error: string | null;
  onRetry: () => void;
  summaries: PartPracticePartSummary[];
}) {
  const answered = summaries.reduce((total, summary) => total + summary.answered, 0);

  return (
    <section aria-labelledby="toeic-title">
      <div className="flex items-center mb-8 gap-4">
        <span className="h-px flex-1 bg-border" />
        <h2
          className="text-2xl font-semibold tracking-tight sm:text-3xl"
          id="toeic-title"
        >
          TOEIC
        </h2>
        <span className="h-px flex-1 bg-border" />
      </div>
      {error ? (
        <InlinePanelState
          actionLabel="Retry Part Practice"
          message={error}
          onAction={onRetry}
        />
      ) : (
        <div className="flex flex-col gap-4 lg:gap-8">
          <div className="grid grid-cols-2 gap-4 lg:gap-8">
            <MetricCard label="Answered" value={answered} />
            <MetricCard label="Study time" value="-" />
          </div>
          <div className="rounded-2xl bg-surface p-5 shadow-card sm:p-6">
            <div className="space-y-5">
              {Array.from({ length: 7 }, (_, index) => (
                <PartProgress
                  key={index + 1}
                  partNumber={index + 1}
                  summary={summaries.find(
                    (summary) => summary.partNumber === index + 1,
                  )}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function MetricCard({ label, value }: { label: string; value: number | string }) {
  return (
    <article className="min-h-32 rounded-2xl bg-surface p-5 shadow-card sm:p-6">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-3 font-mono text-3xl font-semibold tracking-tight tabular-nums sm:text-4xl">
        {value}
      </p>
    </article>
  );
}

function PartProgress({
  partNumber,
  summary,
}: {
  partNumber: number;
  summary: PartPracticePartSummary | undefined;
}) {
  const correct = summary?.correct ?? 0;
  const answered = summary?.answered ?? 0;
  const accuracy = answered > 0 ? Math.round((correct / answered) * 100) : 0;

  return (
    <div>
      <div className="flex items-baseline justify-between gap-4 text-sm">
        <p className="font-medium">Part {partNumber}</p>
        <p className="font-mono tabular-nums text-muted-foreground">
          {correct}/{answered} ({accuracy}%)
        </p>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-foreground"
          style={{ width: `${accuracy}%` }}
        />
      </div>
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
