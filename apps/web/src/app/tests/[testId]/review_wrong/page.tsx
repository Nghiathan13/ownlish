"use client";

import { Suspense, use, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { RequireAuth } from "@/features/auth/components/RequireAuth";
import { useAuthSession } from "@/features/auth/hooks/useAuthSession";
import { PracticePartView } from "@/features/tests/components/PracticePartView";
import { parseSelectedPartsParam } from "@/features/tests/lib/toeicParts";
import { PageShell } from "@/shared/ui/PageShell";
import { Panel } from "@/shared/ui/Panel";

type ReviewWrongPageProps = {
  params: Promise<{
    testId: string;
  }>;
};

function ReviewWrongPageContent({ testId }: { testId: number }) {
  const searchParams = useSearchParams();
  const { accessToken, clearSession } = useAuthSession();

  const selectedParts = useMemo(
    () => parseSelectedPartsParam(searchParams.get("parts") ?? undefined) ?? [],
    [searchParams],
  );

  if (selectedParts.length !== 1) {
    return (
      <PageShell>
        <Panel>
          <p className="text-muted-foreground">
            Select exactly one part to review wrong questions.
          </p>
        </Panel>
      </PageShell>
    );
  }

  return (
    <PracticePartView
      accessToken={accessToken}
      clearSession={clearSession}
      partNumber={selectedParts[0]!}
      practiceMode="wrong_questions"
      testId={testId}
    />
  );
}

export default function ReviewWrongPage({ params }: ReviewWrongPageProps) {
  const resolved = use(params);
  const testId = Number(resolved.testId);

  if (!Number.isInteger(testId)) {
    return (
      <RequireAuth>
        <PageShell>
          <Panel>
            <p className="text-muted-foreground">Invalid review wrong route.</p>
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
              <p className="text-muted-foreground">Loading review wrong...</p>
            </Panel>
          </PageShell>
        }
      >
        <ReviewWrongPageContent testId={testId} />
      </Suspense>
    </RequireAuth>
  );
}
