"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useAuthSession } from "@/features/auth/hooks/useAuthSession";
import { useVocabStats } from "@/features/home/hooks/useVocabStats";
import { classNames } from "@/shared/lib/classNames";
import { Panel } from "@/shared/ui/Panel";
import { PageShell } from "@/shared/ui/PageShell";

const actionLinkClassName =
  "inline-flex items-center justify-center rounded-lg border px-3.5 py-2.5 text-sm font-semibold transition";
const primaryLinkClassName =
  "border-foreground bg-foreground text-background";
const secondaryLinkClassName =
  "border-border bg-transparent text-foreground hover:bg-muted";

export function HomeDashboard() {
  const { accessToken, clearSession, status, user } = useAuthSession();
  const isAuthenticated = status === "authenticated";
  const { error, isLoading, reload, stats } = useVocabStats({
    accessToken,
    clearSession,
    isAuthenticated,
    userId: user?.id ?? null,
  });

  if (status === "checking") {
    return (
      <PageShell centered>
        <Panel className="w-[min(420px,100%)]">
          <p className="text-muted-foreground">Checking your session...</p>
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
          <Link
            className={classNames(actionLinkClassName, primaryLinkClassName)}
            href="/login"
          >
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
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Dashboard
            </p>
            <h1 className="mb-3 text-3xl font-bold leading-tight">
              Your vocabulary overview
            </h1>
            <p className="text-muted-foreground">
              {user?.email}
            </p>
          </div>

          {isLoading ? (
            <DashboardMessage>Loading your dashboard...</DashboardMessage>
          ) : error ? (
            <DashboardMessage>
              <span>{error}</span>
              <button
                className={classNames(actionLinkClassName, secondaryLinkClassName)}
                onClick={() => void reload()}
                type="button"
              >
                Retry
              </button>
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
                <Link
                  className={classNames(actionLinkClassName, primaryLinkClassName)}
                  href="/vocabulary"
                >
                  Manage vocabulary
                </Link>
                <Link
                  className={classNames(actionLinkClassName, secondaryLinkClassName)}
                  href="/review"
                >
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
