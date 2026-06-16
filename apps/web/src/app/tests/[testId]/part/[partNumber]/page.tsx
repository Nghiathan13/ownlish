"use client";

import { use } from "react";
import { RequireAuth } from "@/features/auth/components/RequireAuth";
import { useAuthSession } from "@/features/auth/hooks/useAuthSession";
import { Part1PracticeView } from "@/features/tests/components/Part1PracticeView";
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
  const { accessToken, clearSession } = useAuthSession();

  if (partNumber !== 1) {
    return (
      <PageShell>
        <Panel>
          <p className="text-muted-foreground">
            Part {partNumber} chưa hỗ trợ. Hiện chỉ có Part 1.
          </p>
        </Panel>
      </PageShell>
    );
  }

  return (
    <Part1PracticeView
      accessToken={accessToken}
      clearSession={clearSession}
      partNumber={partNumber}
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
      <PracticePartPageContent partNumber={partNumber} testId={testId} />
    </RequireAuth>
  );
}
