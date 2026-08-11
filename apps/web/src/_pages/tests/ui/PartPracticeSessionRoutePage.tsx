"use client";

import { Suspense, use } from "react";
import { useSearchParams } from "next/navigation";
import { RequireAuth } from "@/features/auth";
import {
  isPartPracticeSessionId,
  parsePartPracticeRunPartParam,
  parsePartPracticeRunMode,
} from "@/entities/toeic-runtime";
import {
  PartPracticeRunView,
  TestRunLoadingSkeleton,
} from "@/features/tests/run";
import { PageShell } from "@/shared/ui/PageShell";
import { Panel } from "@/shared/ui/Panel";
import { useT } from "@/shared/lib/providers";

type PartPracticeSessionRoutePageProps = {
  params: Promise<{ sessionId: string }>;
};

function PartPracticeSessionContent({ sessionId }: { sessionId: string }) {
  const searchParams = useSearchParams();
  const mode = parsePartPracticeRunMode(searchParams.get("mode"));
  const partNumber = parsePartPracticeRunPartParam(searchParams.get("part"));

  return (
    <PartPracticeRunView
      key={`${mode}-${sessionId}`}
      practiceMode={mode}
      partNumber={partNumber}
      sessionId={sessionId}
    />
  );
}

export function PartPracticeSessionRoutePage({
  params,
}: PartPracticeSessionRoutePageProps) {
  const t = useT();
  const resolved = use(params);

  if (!isPartPracticeSessionId(resolved.sessionId)) {
    return (
      <RequireAuth>
        <PageShell>
          <Panel>
            <p className="text-muted-foreground">
              {t("tests.invalidPartPracticeRoute")}
            </p>
          </Panel>
        </PageShell>
      </RequireAuth>
    );
  }

  return (
    <RequireAuth>
      <Suspense fallback={<TestRunLoadingSkeleton variant="part_practice" />}>
        <PartPracticeSessionContent sessionId={resolved.sessionId} />
      </Suspense>
    </RequireAuth>
  );
}
