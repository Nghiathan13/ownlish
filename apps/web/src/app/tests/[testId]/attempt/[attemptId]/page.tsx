"use client";

import { use, Suspense, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { RequireAuth } from "@/features/auth/components/RequireAuth";
import { useAuthSession } from "@/features/auth/hooks/useAuthSession";
import { runAuthenticatedRequest } from "@/features/auth/lib/authRequest";
import { getTestAttempt } from "@/features/tests/api/testsApi";
import { FullTestPracticeView } from "@/features/tests/components/FullTestPracticeView";
import {
  readFullTestSelectedParts,
  writeFullTestSelectedParts,
} from "@/features/tests/lib/fullTestStorage";
import {
  normalizeSelectedParts,
  parseSelectedPartsParam,
} from "@/features/tests/lib/toeicParts";
import { Button } from "@/shared/ui/Button";
import { PageShell } from "@/shared/ui/PageShell";
import { Panel } from "@/shared/ui/Panel";

type FullTestAttemptPageProps = {
  params: Promise<{
    testId: string;
    attemptId: string;
  }>;
};

function FullTestAttemptPageContent({
  testId,
  attemptId,
}: {
  testId: number;
  attemptId: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { accessToken, clearSession } = useAuthSession();

  const selectedParts = useMemo(() => {
    const fromQuery = parseSelectedPartsParam(searchParams.get("parts") ?? undefined);
    const fromStorage = readFullTestSelectedParts(attemptId);
    return normalizeSelectedParts(fromQuery ?? fromStorage);
  }, [attemptId, searchParams]);

  useEffect(() => {
    writeFullTestSelectedParts(attemptId, selectedParts);
  }, [attemptId, selectedParts]);

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
          <p className="text-muted-foreground">Loading full test...</p>
        </Panel>
      </PageShell>
    );
  }

  if (attemptQuery.error || !attemptQuery.data) {
    return (
      <PageShell>
        <Panel>
          <p className="text-muted-foreground">Cannot load this full test attempt.</p>
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

  if (attempt.testId !== testId) {
    return (
      <PageShell>
        <Panel>
          <p className="text-muted-foreground">This attempt does not match the selected test.</p>
        </Panel>
      </PageShell>
    );
  }

  if (attempt.completedAt) {
    router.replace(`/tests/${testId}/attempt/${attemptId}/results`);
    return null;
  }

  return (
    <FullTestPracticeView
      accessToken={accessToken}
      attempt={attempt}
      attemptId={attemptId}
      clearSession={clearSession}
      selectedParts={selectedParts}
      testId={testId}
    />
  );
}

export default function FullTestAttemptPage({ params }: FullTestAttemptPageProps) {
  const resolved = use(params);
  const testId = Number(resolved.testId);
  const attemptId = resolved.attemptId;

  if (!Number.isInteger(testId) || !attemptId) {
    return (
      <RequireAuth>
        <PageShell>
          <Panel>
            <p className="text-muted-foreground">Invalid full test route.</p>
          </Panel>
        </PageShell>
      </RequireAuth>
    );
  }

  return (
    <RequireAuth>
      <Suspense
        fallback={
          <PageShell>
            <Panel>
              <p className="text-muted-foreground">Loading full test...</p>
            </Panel>
          </PageShell>
        }
      >
        <FullTestAttemptPageContent attemptId={attemptId} testId={testId} />
      </Suspense>
    </RequireAuth>
  );
}
