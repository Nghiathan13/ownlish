"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { RequireAuth } from "@/features/auth/components/RequireAuth";
import { useAuthSession } from "@/features/auth/hooks/useAuthSession";
import { runAuthenticatedRequest } from "@/features/auth/lib/authRequest";
import { listTestAttempts } from "@/features/tests/api/testsApi";
import { Button } from "@/shared/ui/Button";
import { PageShell } from "@/shared/ui/PageShell";
import { Panel } from "@/shared/ui/Panel";

function formatDate(value: string) {
  return new Date(value).toLocaleString();
}

function AttemptHistoryContent() {
  const { accessToken, clearSession } = useAuthSession();

  const attemptsQuery = useQuery({
    queryKey: ["test-attempts"],
    queryFn: () =>
      runAuthenticatedRequest({
        accessToken,
        clearSession,
        request: (token) => listTestAttempts(token, { limit: 50, offset: 0 }),
      }),
    enabled: Boolean(accessToken),
  });

  return (
    <PageShell>
      <Panel>
        <div className="mb-6 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">Full test history</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Your completed and in-progress full test attempts.
            </p>
          </div>
          <Link href="/tests">
            <Button type="button" variant="secondary">
              Back to tests
            </Button>
          </Link>
        </div>

        {attemptsQuery.isLoading ? (
          <p className="text-muted-foreground">Loading attempts...</p>
        ) : attemptsQuery.error ? (
          <p className="text-muted-foreground">Cannot load attempt history.</p>
        ) : !attemptsQuery.data || attemptsQuery.data.items.length === 0 ? (
          <p className="text-muted-foreground">No full test attempts yet.</p>
        ) : (
          <div className="space-y-3">
            {attemptsQuery.data.items.map((attempt) => (
              <article
                className="rounded-xl border border-border p-4"
                key={attempt.attemptId}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold">
                      {attempt.testLabel} · TOEIC {attempt.year}
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Started {formatDate(attempt.startedAt)}
                      {attempt.completedAt
                        ? ` · Finished ${formatDate(attempt.completedAt)}`
                        : " · In progress"}
                    </p>
                    <p className="mt-2 text-sm">
                      Correct {attempt.totalCorrect} · Wrong {attempt.totalWrong}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {attempt.completedAt ? (
                      <Link
                        href={`/tests/${attempt.testId}/attempt/${attempt.attemptId}/results`}
                      >
                        <Button type="button" variant="secondary">
                          Results
                        </Button>
                      </Link>
                    ) : attempt.currentPartNumber > 7 ? (
                      <Link
                        href={`/tests/${attempt.testId}/attempt/${attempt.attemptId}/results`}
                      >
                        <Button type="button" variant="secondary">
                          Results
                        </Button>
                      </Link>
                    ) : (
                      <Link
                        href={`/tests/${attempt.testId}/attempt/${attempt.attemptId}/part/${attempt.currentPartNumber}`}
                      >
                        <Button type="button">Continue</Button>
                      </Link>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </Panel>
    </PageShell>
  );
}

export default function AttemptHistoryPage() {
  return (
    <RequireAuth>
      <AttemptHistoryContent />
    </RequireAuth>
  );
}
