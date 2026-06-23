"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { getDefaultUserCollection } from "@/entities/collection/lib/collectionDisplay";
import { useAuthSession, isAuthenticatedStatus, isLoadingStatus } from "@/features/auth/hooks/useAuthSession";
import { useCollectionsListQuery } from "@/features/collections/shared/data/hooks";
import { useVocabStats } from "@/features/home/hooks/useVocabStats";
import { classNames } from "@/shared/lib/classNames";
import {
  primaryTextButtonClassName,
  secondaryTextButtonClassName,
} from "@/shared/ui/button";
import { Panel } from "@/shared/ui/Panel";
import { PageShell } from "@/shared/ui/PageShell";
import { PANEL_CARD_CLASS } from "@/shared/ui/layout";

export function HomeDashboard() {
  const { status, user } = useAuthSession();
  const isAuthenticated = isAuthenticatedStatus(status);
  const { collections, isLoadingCollections } = useCollectionsListQuery({
    isAuthenticated,
    userId: user?.id ?? null,
  });
  const defaultCollection = getDefaultUserCollection(collections);
  const { error, isLoading, reload, stats } = useVocabStats({
    collectionId: defaultCollection?.id ?? null,
    isAuthenticated,
    userId: user?.id ?? null,
  });

  if (isLoadingStatus(status)) {
    return (
      <PageShell centered>
        <Panel className={classNames(PANEL_CARD_CLASS, "w-[min(420px,100%)]")}>
          <p className="text-muted-foreground">Loading session...</p>
        </Panel>
      </PageShell>
    );
  }

  if (!isAuthenticated) {
    return (
      <PageShell>
        <Panel>
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            EngVocab Web
          </p>
          <h1 className="mb-3 text-3xl font-bold leading-tight">
            Build and review your English vocabulary.
          </h1>
          <p className="mb-6 text-muted-foreground">
            Sign in to manage your words, review due vocabulary, and track your
            learning progress.
          </p>
          <Link className={primaryTextButtonClassName()} href="/login">
            Sign in
          </Link>
        </Panel>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <Panel>
        <div className="flex flex-col gap-6">
          {isLoading || isLoadingCollections ? (
            <DashboardMessage>Loading your dashboard...</DashboardMessage>
          ) : error ? (
            <DashboardMessage>
              <span>{error}</span>
              <button
                className={secondaryTextButtonClassName()}
                onClick={() => void reload()}
                type="button"
              >
                Retry
              </button>
            </DashboardMessage>
          ) : stats?.total === 0 ? (
            <DashboardMessage>
              <div>
                <p className="font-semibold text-foreground">
                  Your vocabulary is empty.
                </p>
                <p className="text-sm">
                  Add your first word to start tracking review progress.
                </p>
              </div>
              <Link className={primaryTextButtonClassName()} href="/collections">
                Browse collections
              </Link>
            </DashboardMessage>
          ) : stats ? (
            <>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard label="Total words" value={stats.total} />
                <StatCard label="Due today" value={stats.due} />
                <StatCard label="Mastered" value={stats.mastered} />
                <StatCard label="High wrong count" value={stats.highWrongCount} />
              </div>

              <div className="rounded-xl border border-border p-4">
                <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-muted-foreground">
                  Level distribution
                </h2>
                <div className="grid gap-2 sm:grid-cols-4">
                  {stats.levels.map((level) => (
                    <div
                      className="rounded-lg bg-muted px-3 py-2"
                      key={level.level}
                    >
                      <p className="text-xs font-semibold text-muted-foreground">
                        Level {level.level}
                      </p>
                      <p className="text-lg font-bold">{level.count}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link className={primaryTextButtonClassName()} href="/collections">
                  Manage collections
                </Link>
                <Link className={secondaryTextButtonClassName()} href="/review">
                  Review due words
                </Link>
              </div>
            </>
          ) : null}
        </div>
      </Panel>
    </PageShell>
  );
}

function DashboardMessage({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border p-4 text-muted-foreground">
      {children}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border bg-muted p-4">
      <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="text-3xl font-bold">{value}</p>
    </div>
  );
}
