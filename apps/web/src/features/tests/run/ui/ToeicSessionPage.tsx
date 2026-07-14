"use client";

import { Suspense, use, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { RequireAuth } from "@/features/auth/components/RequireAuth";
import { MockRunView } from "@/features/tests/run/ui/mock/MockRunView";
import { PracticeRunView } from "@/features/tests/run/components/PracticeRunView";
import type { PracticeMode } from "@/entities/toeic/api/types";
import {
  DEFAULT_TOEIC_YEAR,
  getTestsListPath,
} from "@/features/tests/shared/constants/toeicYears";
import {
  isToeicSessionId,
  parseToeicRunPartsParam,
} from "@/features/tests/shared/lib/toeicRunPaths";
import { TestRunLoadingSkeleton } from "@/features/tests/run/components/TestRunLoadingSkeleton";
import { secondaryTextButtonClassName } from "@/shared/ui/button";
import { PageShell } from "@/shared/ui/PageShell";
import { Panel } from "@/shared/ui/Panel";

export type ToeicSessionMode = PracticeMode | "mock_test";

type ToeicSessionPageProps = {
  params: Promise<{
    sessionId: string;
  }>;
  mode: ToeicSessionMode;
};

type SessionCopy = {
  invalidRoute: string;
  selectParts: string;
};

const SESSION_COPY: Record<ToeicSessionMode, SessionCopy> = {
  practice: {
    invalidRoute: "Invalid practice route.",
    selectParts: "Select at least one test part.",
  },
  review_wrong: {
    invalidRoute: "Invalid review wrong route.",
    selectParts: "Select at least one part to review wrong questions.",
  },
  mock_test: {
    invalidRoute: "Invalid mock test route.",
    selectParts: "Select at least one test part.",
  },
};

type ToeicSessionPageContentProps = {
  mode: ToeicSessionMode;
  sessionId: string;
};

function EmptyPartsState({ copy }: { copy: SessionCopy }) {
  const router = useRouter();
  const testsListPath = getTestsListPath(DEFAULT_TOEIC_YEAR);

  return (
    <PageShell>
      <Panel>
        <p className="text-muted-foreground">{copy.selectParts}</p>
        <div className="mt-4">
          <button
            className={secondaryTextButtonClassName()}
            onClick={() => router.push(testsListPath)}
            type="button"
          >
            Back to tests
          </button>
        </div>
      </Panel>
    </PageShell>
  );
}

function ToeicSessionPageContent({ mode, sessionId }: ToeicSessionPageContentProps) {
  const searchParams = useSearchParams();
  const copy = SESSION_COPY[mode];
  const selectedParts = useMemo(
    () => parseToeicRunPartsParam(searchParams.get("parts")),
    [searchParams],
  );

  if (selectedParts.length === 0) {
    return <EmptyPartsState copy={copy} />;
  }

  if (mode === "mock_test") {
    return (
      <MockRunView
        key={sessionId}
        selectedParts={selectedParts}
        sessionId={sessionId}
      />
    );
  }

  return (
    <PracticeRunView
      practiceMode={mode}
      selectedParts={selectedParts}
      sessionId={sessionId}
    />
  );
}

export function ToeicSessionPage({ params, mode }: ToeicSessionPageProps) {
  const resolved = use(params);
  const copy = SESSION_COPY[mode];

  if (!isToeicSessionId(resolved.sessionId)) {
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
      <Suspense fallback={<TestRunLoadingSkeleton variant={mode} />}>
        <ToeicSessionPageContent mode={mode} sessionId={resolved.sessionId} />
      </Suspense>
    </RequireAuth>
  );
}
