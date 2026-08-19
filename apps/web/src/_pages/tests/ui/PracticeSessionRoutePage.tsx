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
import { PracticeRunView, TestRunLoadingSkeleton } from "@/features/test-study";
import { DictionaryLookupBoundary } from "@/features/dictionary-lookup";
import { secondaryTextButtonClassName } from "@/shared/ui/button";
import { PageShell } from "@/shared/ui/PageShell";
import { Panel } from "@/shared/ui/Panel";
import type { MessageKey } from "@/shared/i18n";
import { useT } from "@/shared/lib/providers";

type PracticeSessionRoutePageProps = {
  mode: PracticeMode;
  params: Promise<{ sessionId: string }>;
};

const SESSION_COPY_KEYS: Record<
  PracticeMode,
  { invalidRoute: MessageKey; selectParts: MessageKey }
> = {
  practice: {
    invalidRoute: "tests.invalidPracticeRoute",
    selectParts: "tests.selectAtLeastOnePart",
  },
  review_wrong: {
    invalidRoute: "tests.invalidReviewWrongRoute",
    selectParts: "tests.selectPartsReviewWrong",
  },
};

function EmptyPartsState({ selectParts }: { selectParts: MessageKey }) {
  const t = useT();
  const router = useRouter();

  return (
    <PageShell>
      <Panel>
        <p className="text-muted-foreground">{t(selectParts)}</p>
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

function PracticeSessionContent({
  mode,
  sessionId,
}: {
  mode: PracticeMode;
  sessionId: string;
}) {
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
    return <EmptyPartsState selectParts={copyKeys.selectParts} />;
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

export function PracticeSessionRoutePage({
  mode,
  params,
}: PracticeSessionRoutePageProps) {
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
        <PracticeSessionContent mode={mode} sessionId={resolved.sessionId} />
      </Suspense>
    </RequireAuth>
  );
}
