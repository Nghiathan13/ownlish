"use client";

import { Suspense, use, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { RequireAuth } from "@/features/auth";
import type { PracticeMode } from "@/entities/toeic-runtime";
import {
  DEFAULT_TOEIC_YEAR,
  getTestsListPath,
  isToeicSessionId,
  parseToeicRunPartsParam,
  parseToeicRunTestKeyParam,
} from "@/entities/toeic-runtime";
import {
  MockRunView,
  PracticeRunView,
  TestRunLoadingSkeleton,
} from "@/features/tests/run";
import { DictionaryLookupBoundary } from "@/features/dictionary-lookup";
import { secondaryTextButtonClassName } from "@/shared/ui/button";
import { PageShell } from "@/shared/ui/PageShell";
import { Panel } from "@/shared/ui/Panel";
import type { MessageKey } from "@/shared/i18n";
import { useT } from "@/shared/lib/providers";

type ToeicSessionRoutePageProps = {
  mode: "mock_test" | "practice" | "review_wrong";
  params: Promise<{ sessionId: string }>;
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

type ToeicSessionMode = PracticeMode | "mock_test";

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

function ToeicSessionContent({ mode, sessionId }: { mode: ToeicSessionMode; sessionId: string }) {
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
      <DictionaryLookupBoundary>
        <MockRunView
          key={sessionId}
          sessionId={sessionId}
          selectedParts={selectedParts}
          testKey={testKey}
        />
      </DictionaryLookupBoundary>
    );
  }

  return (
    <DictionaryLookupBoundary>
      <PracticeRunView
        key={`${mode}-${sessionId}`}
        practiceMode={mode}
        selectedParts={selectedParts}
        sessionId={sessionId}
        testKey={testKey}
      />
    </DictionaryLookupBoundary>
  );
}

export function ToeicSessionRoutePage({
  mode,
  params,
}: ToeicSessionRoutePageProps) {
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
        <ToeicSessionContent mode={mode} sessionId={resolved.sessionId} />
      </Suspense>
    </RequireAuth>
  );
}
