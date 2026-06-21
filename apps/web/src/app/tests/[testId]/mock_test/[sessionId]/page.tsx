"use client";

import { use } from "react";
import { RequireAuth } from "@/features/auth/components/RequireAuth";
import { MockRunView } from "@/features/tests/run/components/MockRunView";
import { PageShell } from "@/shared/ui/PageShell";
import { Panel } from "@/shared/ui/Panel";

type MockTestPageProps = {
  params: Promise<{
    testId: string;
    sessionId: string;
  }>;
};

export default function MockTestPage({ params }: MockTestPageProps) {
  const resolved = use(params);
  const testId = Number(resolved.testId);

  if (!Number.isInteger(testId) || !resolved.sessionId) {
    return (
      <RequireAuth>
        <PageShell>
          <Panel>
            <p className="text-muted-foreground">Invalid mock test route.</p>
          </Panel>
        </PageShell>
      </RequireAuth>
    );
  }

  return (
    <RequireAuth>
      <MockRunView sessionId={resolved.sessionId} testId={testId} />
    </RequireAuth>
  );
}
