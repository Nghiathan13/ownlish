
"use client";

import { Suspense, use, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { RequireAuth } from "@/features/auth/components/RequireAuth";
import { useAuthSession } from "@/features/auth/hooks/useAuthSession";
import { PracticeRunView } from "@/features/tests/components/PracticeRunView";
import { useTestsList } from "@/features/tests/hooks/useTestsList";
import {
  normalizeSelectedParts,
  parseSelectedPartsParam,
} from "@/features/tests/lib/toeicParts";
import { Button } from "@/shared/ui/Button";
import { PageShell } from "@/shared/ui/PageShell";
import { Panel } from "@/shared/ui/Panel";

type PracticeRunPageProps = {
  params: Promise<{
    testId: string;
  }>;
};

function PracticeRunPageContent({ testId }: { testId: number }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { accessToken, clearSession, status, user } = useAuthSession();

  const selectedParts = useMemo(() => {
    const fromQuery = parseSelectedPartsParam(searchParams.get("parts") ?? undefined);
    return normalizeSelectedParts(fromQuery);
  }, [searchParams]);

  const { tests, isLoadingTests, testsError } = useTestsList({
    accessToken,
    clearSession,
    isAuthenticated: status === "authenticated",
    userId: user?.id ?? null,
  });

  if (isLoadingTests) {
    return (
      <PageShell>
        <Panel>
          <p className="text-muted-foreground">Loading practice...</p>
        </Panel>
      </PageShell>
    );
  }

  if (testsError) {
    return (
      <PageShell>
        <Panel>
          <p className="text-muted-foreground">{testsError}</p>
          <div className="mt-4">
            <Button onClick={() => router.push("/tests")} type="button" variant="secondary">
              Back to tests
            </Button>
          </div>
        </Panel>
      </PageShell>
    );
  }

  const test = tests.find((item) => item.id === testId);

  if (!test) {
    return (
      <PageShell>
        <Panel>
          <p className="text-muted-foreground">Test not found.</p>
          <div className="mt-4">
            <Button onClick={() => router.push("/tests")} type="button" variant="secondary">
              Back to tests
            </Button>
          </div>
        </Panel>
      </PageShell>
    );
  }

  if (selectedParts.length === 0) {
    return (
      <PageShell>
        <Panel>
          <p className="text-muted-foreground">Select at least one test part.</p>
          <div className="mt-4">
            <Button onClick={() => router.push("/tests")} type="button" variant="secondary">
              Back to tests
            </Button>
          </div>
        </Panel>
      </PageShell>
    );
  }

  return (
    <PracticeRunView
      accessToken={accessToken}
      clearSession={clearSession}
      selectedParts={selectedParts}
      testId={testId}
    />
  );
}

export default function PracticeRunPage({ params }: PracticeRunPageProps) {
  const resolved = use(params);
  const testId = Number(resolved.testId);

  if (!Number.isInteger(testId)) {
    return (
      <RequireAuth>
        <PageShell>
          <Panel>
            <p className="text-muted-foreground">Invalid practice route.</p>
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
              <p className="text-muted-foreground">Loading practice...</p>
            </Panel>
          </PageShell>
        }
      >
        <PracticeRunPageContent testId={testId} />
      </Suspense>
    </RequireAuth>
  );
}
