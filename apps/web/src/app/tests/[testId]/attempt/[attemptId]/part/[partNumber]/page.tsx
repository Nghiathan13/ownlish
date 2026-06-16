"use client";

import { use, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { RequireAuth } from "@/features/auth/components/RequireAuth";
import { useAuthSession } from "@/features/auth/hooks/useAuthSession";
import { runAuthenticatedRequest } from "@/features/auth/lib/authRequest";
import {
  completeTestAttemptPart,
  getTestAttempt,
} from "@/features/tests/api/testsApi";
import { PracticePartView } from "@/features/tests/components/PracticePartView";
import { isSupportedPracticePart } from "@/features/tests/lib/partPracticeConfig";
import { Button } from "@/shared/ui/Button";
import { PageShell } from "@/shared/ui/PageShell";
import { Panel } from "@/shared/ui/Panel";

type FullTestPartPageProps = {
  params: Promise<{
    testId: string;
    attemptId: string;
    partNumber: string;
  }>;
};

function FullTestPartPageContent({
  testId,
  attemptId,
  partNumber,
}: {
  testId: number;
  attemptId: string;
  partNumber: number;
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

  const handlePartComplete = useCallback(
    async (result: { correctCount: number; wrongCount: number }) => {
      const updatedAttempt = await runAuthenticatedRequest({
        accessToken,
        clearSession,
        request: (token) =>
          completeTestAttemptPart(token, attemptId, partNumber, result),
      });

      if (updatedAttempt.completedAt || partNumber >= 7) {
        router.push(`/tests/${testId}/attempt/${attemptId}/results`);
        return;
      }

      router.push(
        `/tests/${testId}/attempt/${attemptId}/part/${partNumber + 1}`,
      );
    },
    [accessToken, attemptId, clearSession, partNumber, router, testId],
  );

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

  if (partNumber !== attempt.currentPartNumber) {
    if (attempt.currentPartNumber > 7) {
      router.replace(`/tests/${testId}/attempt/${attemptId}/results`);
      return null;
    }

    router.replace(
      `/tests/${testId}/attempt/${attemptId}/part/${attempt.currentPartNumber}`,
    );
    return null;
  }

  return (
    <PracticePartView
      accessToken={accessToken}
      clearSession={clearSession}
      fullTestContext={{
        attemptId,
        onPartComplete: handlePartComplete,
      }}
      partNumber={partNumber}
      practiceMode="normal"
      testId={testId}
    />
  );
}

export default function FullTestPartPage({ params }: FullTestPartPageProps) {
  const resolved = use(params);
  const testId = Number(resolved.testId);
  const partNumber = Number(resolved.partNumber);
  const attemptId = resolved.attemptId;

  if (
    !Number.isInteger(testId) ||
    !Number.isInteger(partNumber) ||
    !attemptId ||
    !isSupportedPracticePart(partNumber)
  ) {
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
      <FullTestPartPageContent
        attemptId={attemptId}
        partNumber={partNumber}
        testId={testId}
      />
    </RequireAuth>
  );
}
