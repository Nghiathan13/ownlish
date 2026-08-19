"use client";

import { Suspense, use, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { RequireAuth } from "@/features/auth";
import {
  DEFAULT_TOEIC_YEAR,
  getTestsListPath,
  isToeicSessionId,
  parseToeicRunPartsParam,
  parseToeicRunTestKeyParam,
} from "@/entities/toeic-runtime";
import { MockRunView, TestRunLoadingSkeleton } from "@/features/test-study";
import { DictionaryLookupBoundary } from "@/features/dictionary-lookup";
import { secondaryTextButtonClassName } from "@/shared/ui/button";
import { PageShell } from "@/shared/ui/PageShell";
import { Panel } from "@/shared/ui/Panel";
import { useT } from "@/shared/lib/providers";

type MockSessionRoutePageProps = {
  params: Promise<{ sessionId: string }>;
};

function EmptyPartsState() {
  const t = useT();
  const router = useRouter();

  return (
    <PageShell>
      <Panel>
        <p className="text-muted-foreground">{t("tests.selectAtLeastOnePart")}</p>
        <div className="mt-4">
          <button
            className={secondaryTextButtonClassName()}
            onClick={() => router.push(getTestsListPath(DEFAULT_TOEIC_YEAR))}
            type="button"
          >
            {t("tests.backToTests")}
          </button>
        </div>
      </Panel>
    </PageShell>
  );
}

function MockSessionContent({ sessionId }: { sessionId: string }) {
  const searchParams = useSearchParams();
  const selectedParts = useMemo(
    () => parseToeicRunPartsParam(searchParams.get("parts")),
    [searchParams],
  );
  const testKey = useMemo(
    () => parseToeicRunTestKeyParam(searchParams.get("test")),
    [searchParams],
  );

  if (selectedParts.length === 0) {
    return <EmptyPartsState />;
  }

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

export function MockSessionRoutePage({ params }: MockSessionRoutePageProps) {
  const t = useT();
  const resolved = use(params);

  if (!isToeicSessionId(resolved.sessionId)) {
    return (
      <RequireAuth>
        <PageShell>
          <Panel>
            <p className="text-muted-foreground">{t("tests.invalidMockTestRoute")}</p>
          </Panel>
        </PageShell>
      </RequireAuth>
    );
  }

  return (
    <RequireAuth>
      <Suspense fallback={<TestRunLoadingSkeleton variant="mock_test" />}>
        <MockSessionContent sessionId={resolved.sessionId} />
      </Suspense>
    </RequireAuth>
  );
}
