"use client";

import { Suspense, use, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { RequireAuth } from "@/features/auth/components/RequireAuth";
import { MockRunView } from "@/features/tests/run/components/MockRunView";
import { getTestsListPath, DEFAULT_TOEIC_YEAR } from "@/features/tests/shared/constants/toeicYears";
import {
  isToeicSessionId,
  parseToeicRunPartsParam,
} from "@/features/tests/shared/lib/toeicRunPaths";
import { secondaryTextButtonClassName } from "@/shared/ui/button";
import { PageShell } from "@/shared/ui/PageShell";
import { Panel } from "@/shared/ui/Panel";

type MockTestRunPageProps = {
  params: Promise<{
    sessionId: string;
  }>;
};

function MockTestRunPageContent({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedParts = useMemo(() => {
    return parseToeicRunPartsParam(searchParams.get("parts"));
  }, [searchParams]);

  if (selectedParts.length === 0) {
    return (
      <PageShell>
        <Panel>
          <p className="text-muted-foreground">Select at least one test part.</p>
          <div className="mt-4">
            <button
              className={secondaryTextButtonClassName()}
              onClick={() => router.push(getTestsListPath(DEFAULT_TOEIC_YEAR))}
              type="button"
            >
              Back to tests
            </button>
          </div>
        </Panel>
      </PageShell>
    );
  }

  return <MockRunView selectedParts={selectedParts} sessionId={sessionId} />;
}

export function MockTestRunPage({ params }: MockTestRunPageProps) {
  const resolved = use(params);

  if (!isToeicSessionId(resolved.sessionId)) {
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
      <Suspense
        fallback={
          <PageShell>
            <Panel>
              <p className="text-muted-foreground">Loading mock test...</p>
            </Panel>
          </PageShell>
        }
      >
        <MockTestRunPageContent sessionId={resolved.sessionId} />
      </Suspense>
    </RequireAuth>
  );
}
