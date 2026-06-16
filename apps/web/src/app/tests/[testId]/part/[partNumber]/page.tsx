"use client";

import { use, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { RequireAuth } from "@/features/auth/components/RequireAuth";
import { useAuthSession } from "@/features/auth/hooks/useAuthSession";
import { PracticePartView } from "@/features/tests/components/PracticePartView";
import type { PracticeMode } from "@/features/tests/api/types";
import { isSupportedPracticePart } from "@/features/tests/lib/partPracticeConfig";
import { PageShell } from "@/shared/ui/PageShell";
import { Panel } from "@/shared/ui/Panel";

type PracticePartPageProps = {
  params: Promise<{
    testId: string;
    partNumber: string;
  }>;
};

function PracticePartPageContent({
  testId,
  partNumber,
}: {
  testId: number;
  partNumber: number;
}) {
  const searchParams = useSearchParams();
  const { accessToken, clearSession } = useAuthSession();
  const practiceMode: PracticeMode =
    searchParams.get("mode") === "wrong_questions"
      ? "wrong_questions"
      : "normal";

  if (!isSupportedPracticePart(partNumber)) {
    return (
      <PageShell>
        <Panel>
          <p className="text-muted-foreground">
            Part {partNumber} is not supported.
          </p>
        </Panel>
      </PageShell>
    );
  }

  return (
    <PracticePartView
      accessToken={accessToken}
      clearSession={clearSession}
      partNumber={partNumber}
      practiceMode={practiceMode}
      testId={testId}
    />
  );
}

export default function PracticePartPage({ params }: PracticePartPageProps) {
  const resolved = use(params);
  const testId = Number(resolved.testId);
  const partNumber = Number(resolved.partNumber);

  if (!Number.isInteger(testId) || !Number.isInteger(partNumber)) {
    return (
      <RequireAuth>
        <PageShell>
          <Panel>
            <p className="text-muted-foreground">Invalid test route.</p>
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
        <PracticePartPageContent partNumber={partNumber} testId={testId} />
      </Suspense>
    </RequireAuth>
  );
}
