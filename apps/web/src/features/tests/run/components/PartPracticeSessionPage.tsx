"use client";

import { Suspense, use } from "react";
import { useSearchParams } from "next/navigation";
import { RequireAuth } from "@/features/auth/components/RequireAuth";
import { PartPracticeRunView } from "@/features/tests/run/components/PartPracticeRunView";
import { TestRunLoadingSkeleton } from "@/features/tests/run/components/TestRunLoadingSkeleton";
import {
  isPartPracticeSessionId,
  parsePartPracticeRunMode,
} from "@/features/tests/shared/lib/partPracticePaths";
import { PageShell } from "@/shared/ui/PageShell";
import { Panel } from "@/shared/ui/Panel";

type PartPracticeSessionPageProps = {
  params: Promise<{
    sessionId: string;
  }>;
};

function PartPracticeSessionPageContent({
  sessionId,
}: {
  sessionId: string;
}) {
  const searchParams = useSearchParams();
  const mode = parsePartPracticeRunMode(searchParams.get("mode"));

  return <PartPracticeRunView practiceMode={mode} sessionId={sessionId} />;
}

export function PartPracticeSessionPage({ params }: PartPracticeSessionPageProps) {
  const resolved = use(params);

  if (!isPartPracticeSessionId(resolved.sessionId)) {
    return (
      <RequireAuth>
        <PageShell>
          <Panel>
            <p className="text-muted-foreground">Invalid part practice route.</p>
          </Panel>
        </PageShell>
      </RequireAuth>
    );
  }

  return (
    <RequireAuth>
      <Suspense fallback={<TestRunLoadingSkeleton variant="part_practice" />}>
        <PartPracticeSessionPageContent sessionId={resolved.sessionId} />
      </Suspense>
    </RequireAuth>
  );
}
