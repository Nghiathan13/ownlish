"use client";

import { Suspense, use, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { RequireAuth } from "@/features/auth/components/RequireAuth";
import { useAuthSession } from "@/features/auth/hooks/useAuthSession";
import { PracticeRunView } from "@/features/tests/run/components/PracticeRunView";
import type { PracticeMode } from "@/features/tests/shared/api/types";
import { useTestsList } from "@/features/tests/overview/hooks/useTestsList";
import {
  normalizeSelectedParts,
  parseSelectedPartsParam,
} from "@/features/tests/shared/lib/toeicParts";
import { Button } from "@/shared/ui/Button";
import { PageShell } from "@/shared/ui/PageShell";
import { Panel } from "@/shared/ui/Panel";

type ToeicRunPageProps = {
  params: Promise<{
    testId: string;
  }>;
  mode: PracticeMode;
};

type ToeicRunPageContentProps = {
  mode: PracticeMode;
  testId: number;
};

function getCopy(mode: PracticeMode) {
  if (mode === "review_wrong") {
    return {
      invalidRoute: "Invalid review wrong route.",
      loading: "Loading review wrong...",
      selectParts: "Select at least one part to review wrong questions.",
    };
  }

  return {
    invalidRoute: "Invalid practice route.",
    loading: "Loading practice...",
    selectParts: "Select at least one test part.",
  };
}

function ToeicRunPageContent({ mode, testId }: ToeicRunPageContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status, user } = useAuthSession();
  const copy = getCopy(mode);

  const selectedParts = useMemo(() => {
    const fromQuery = parseSelectedPartsParam(searchParams.get("parts") ?? undefined);
    return normalizeSelectedParts(fromQuery);
  }, [searchParams]);

  const { tests, isLoadingTests, testsError } = useTestsList({
    isAuthenticated: status === "authenticated",
    userId: user?.id ?? null,
  });

  if (isLoadingTests) {
    return (
      <PageShell>
        <Panel>
          <p className="text-muted-foreground">{copy.loading}</p>
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
          <p className="text-muted-foreground">{copy.selectParts}</p>
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
      practiceMode={mode}
      selectedParts={selectedParts}
      testId={testId}
    />
  );
}

export function ToeicRunPage({ params, mode }: ToeicRunPageProps) {
  const resolved = use(params);
  const testId = Number(resolved.testId);
  const copy = getCopy(mode);

  if (!Number.isInteger(testId)) {
    return (
      <RequireAuth>
        <PageShell>
          <Panel>
            <p className="text-muted-foreground">{copy.invalidRoute}</p>
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
              <p className="text-muted-foreground">{copy.loading}</p>
            </Panel>
          </PageShell>
        }
      >
        <ToeicRunPageContent mode={mode} testId={testId} />
      </Suspense>
    </RequireAuth>
  );
}
