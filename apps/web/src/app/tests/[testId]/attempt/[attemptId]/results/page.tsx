"use client";

import { use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { RequireAuth } from "@/features/auth/components/RequireAuth";
import { useAuthSession } from "@/features/auth/hooks/useAuthSession";
import { runAuthenticatedRequest } from "@/features/auth/lib/authRequest";
import { getTestAttempt } from "@/features/tests/api/testsApi";
import { Button } from "@/shared/ui/Button";
import { PageShell } from "@/shared/ui/PageShell";
import { Panel } from "@/shared/ui/Panel";

type FullTestResultsPageProps = {
  params: Promise<{
    testId: string;
    attemptId: string;
  }>;
};

function formatDate(value: string) {
  return new Date(value).toLocaleString();
}

function FullTestResultsContent({
  attemptId,
}: {
  attemptId: string;
}) {
  const router = useRouter();
  const { accessToken, clearSession } = useAuthSession();

  const attemptQuery = useQuery({
    queryKey: ["test-attempt", attemptId],
    queryFn: () =>
      runAuthenticatedRequest({
        accessToken,
        clearSession,
        request: (token) => getTestAttempt(token, attemptId),
      }),
    enabled: Boolean(accessToken),
  });

  if (attemptQuery.isLoading) {
    return (
      <PageShell>
        <Panel>
          <p className="text-muted-foreground">Loading results...</p>
        </Panel>
      </PageShell>
    );
  }

  if (attemptQuery.error || !attemptQuery.data) {
    return (
      <PageShell>
        <Panel>
          <p className="text-muted-foreground">Cannot load full test results.</p>
          <div className="mt-4">
            <Button onClick={() => router.push("/tests")} type="button" variant="secondary">
              Back to tests
            </Button>
          </div>
        </Panel>
      </PageShell>
    );
  }

  const attempt = attemptQuery.data;
  const totalQuestions = attempt.totalCorrect + attempt.totalWrong;

  return (
    <PageShell>
      <Panel>
        <p className="text-sm text-muted-foreground">
          TOEIC {attempt.year} · {attempt.testLabel}
        </p>
        <h1 className="mt-1 text-2xl font-semibold">Full test results</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Started {formatDate(attempt.startedAt)}
          {attempt.completedAt ? ` · Finished ${formatDate(attempt.completedAt)}` : ""}
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-border p-4">
            <p className="text-sm text-muted-foreground">Correct</p>
            <p className="text-2xl font-semibold">{attempt.totalCorrect}</p>
          </div>
          <div className="rounded-xl border border-border p-4">
            <p className="text-sm text-muted-foreground">Wrong</p>
            <p className="text-2xl font-semibold">{attempt.totalWrong}</p>
          </div>
          <div className="rounded-xl border border-border p-4">
            <p className="text-sm text-muted-foreground">Answered</p>
            <p className="text-2xl font-semibold">{totalQuestions}</p>
          </div>
        </div>

        <div className="mt-8">
          <h2 className="mb-3 text-lg font-semibold">By part</h2>
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/40 text-left">
                <tr>
                  <th className="px-4 py-3 font-semibold">Part</th>
                  <th className="px-4 py-3 font-semibold">Correct</th>
                  <th className="px-4 py-3 font-semibold">Wrong</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {attempt.parts.map((part) => (
                  <tr className="border-t border-border" key={part.partNumber}>
                    <td className="px-4 py-3">Part {part.partNumber}</td>
                    <td className="px-4 py-3">{part.correctCount}</td>
                    <td className="px-4 py-3">{part.wrongCount}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {part.completedAt ? "Completed" : "Not completed"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-2">
          <Button onClick={() => router.push("/tests")} type="button">
            Back to tests
          </Button>
          <Link href="/tests/attempts">
            <Button type="button" variant="secondary">
              View history
            </Button>
          </Link>
        </div>
      </Panel>
    </PageShell>
  );
}

export default function FullTestResultsPage({ params }: FullTestResultsPageProps) {
  const resolved = use(params);
  const testId = Number(resolved.testId);
  const attemptId = resolved.attemptId;

  if (!Number.isInteger(testId) || !attemptId) {
    return (
      <RequireAuth>
        <PageShell>
          <Panel>
            <p className="text-muted-foreground">Invalid results route.</p>
          </Panel>
        </PageShell>
      </RequireAuth>
    );
  }

  return (
    <RequireAuth>
      <FullTestResultsContent attemptId={attemptId} />
    </RequireAuth>
  );
}
