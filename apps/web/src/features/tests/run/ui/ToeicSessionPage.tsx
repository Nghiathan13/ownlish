"use client";

import { Suspense, use, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { RequireAuth } from "@/features/auth/components/RequireAuth";
import { MockRunView } from "@/features/tests/run/ui/mock/MockRunView";
import { PracticeRunView } from "@/features/tests/run/components/PracticeRunView";
import type { PracticeMode } from "@/entities/toeic-runtime/model/presentation";
import {
  DEFAULT_TOEIC_YEAR,
  getTestsListPath,
} from "@/features/tests/shared/constants/toeicYears";
import {
  isToeicSessionId,
  parseToeicRunPartsParam,
  parseToeicRunTestKeyParam,
} from "@/features/tests/shared/lib/toeicRunPaths";
import { TestRunLoadingSkeleton } from "@/features/tests/run/components/TestRunLoadingSkeleton";
import { secondaryTextButtonClassName } from "@/shared/ui/button";
import { PageShell } from "@/shared/ui/PageShell";
import { Panel } from "@/shared/ui/Panel";
import type { MessageKey } from "@/shared/i18n/messages";
import { useT } from "@/shared/providers/LocaleProvider";

export type ToeicSessionMode = PracticeMode | "mock_test";

type ToeicSessionPageProps = {
  params: Promise<{
    sessionId: string;
  }>;
  mode: ToeicSessionMode;
};

type SessionCopyKeys = {
  invalidRoute: MessageKey;
  selectParts: MessageKey;
};

const SESSION_COPY_KEYS: Record<ToeicSessionMode, SessionCopyKeys> = {
  practice: {
    invalidRoute: "tests.invalidPracticeRoute",
    selectParts: "tests.selectAtLeastOnePart",
  },
  review_wrong: {
    invalidRoute: "tests.invalidReviewWrongRoute",
    selectParts: "tests.selectPartsReviewWrong",
  },
  mock_test: {
    invalidRoute: "tests.invalidMockTestRoute",
    selectParts: "tests.selectAtLeastOnePart",
  },
};

type ToeicSessionPageContentProps = {
  mode: ToeicSessionMode;
  sessionId: string;
};

function EmptyPartsState({ copyKeys }: { copyKeys: SessionCopyKeys }) {
  const t = useT();
  const router = useRouter();
  const testsListPath = getTestsListPath(DEFAULT_TOEIC_YEAR);

  return (
    <PageShell>
      <Panel>
        <p className="text-muted-foreground">{t(copyKeys.selectParts)}</p>
        <div className="mt-4">
          <button
            className={secondaryTextButtonClassName()}
            onClick={() => router.push(testsListPath)}
            type="button"
          >
            {t("tests.backToTests")}
          </button>
        </div>
      </Panel>
    </PageShell>
  );
}

function ToeicSessionPageContent({ mode, sessionId }: ToeicSessionPageContentProps) {
  const searchParams = useSearchParams();
  const copyKeys = SESSION_COPY_KEYS[mode];
  const selectedParts = useMemo(
    () => parseToeicRunPartsParam(searchParams.get("parts")),
    [searchParams],
  );
  const testKey = useMemo(
    () => parseToeicRunTestKeyParam(searchParams.get("test")),
    [searchParams],
  );

  if (selectedParts.length === 0) {
    return <EmptyPartsState copyKeys={copyKeys} />;
  }

  if (mode === "mock_test") {
    return (
      <MockRunView
        key={sessionId}
        sessionId={sessionId}
        selectedParts={selectedParts}
        testKey={testKey}
      />
    );
  }

  return (
    <PracticeRunView
      key={`${mode}-${sessionId}`}
      practiceMode={mode}
      selectedParts={selectedParts}
      sessionId={sessionId}
      testKey={testKey}
    />
  );
}

export function ToeicSessionPage({ params, mode }: ToeicSessionPageProps) {
  const t = useT();
  const resolved = use(params);
  const copyKeys = SESSION_COPY_KEYS[mode];

  if (!isToeicSessionId(resolved.sessionId)) {
    return (
      <RequireAuth>
        <PageShell>
          <Panel>
            <p className="text-muted-foreground">{t(copyKeys.invalidRoute)}</p>
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
