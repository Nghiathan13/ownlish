"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthSession } from "@/features/auth/hooks/useAuthSession";
import { PartPickerModal } from "@/features/tests/components/PartPickerModal";
import { TestCard } from "@/features/tests/components/TestCard";
import { useTestsList } from "@/features/tests/hooks/useTestsList";
import { Button } from "@/shared/ui/Button";
import { PageShell } from "@/shared/ui/PageShell";
import { Panel } from "@/shared/ui/Panel";
import type { ToeicTestSummary } from "@/features/tests/api/types";

export function TestsPage() {
  const router = useRouter();
  const { accessToken, clearSession, status, user } = useAuthSession();
  const [selectedTest, setSelectedTest] = useState<ToeicTestSummary | null>(
    null,
  );
  const { tests, testsError, isLoadingTests, reloadTests } = useTestsList({
    accessToken,
    clearSession,
    isAuthenticated: status === "authenticated",
    userId: user?.id ?? null,
  });

  return (
    <PageShell>
      <Panel>
        <div className="mb-6 flex flex-wrap gap-2">
          <button
            className="rounded-lg border border-foreground bg-foreground px-3.5 py-2 text-sm font-semibold text-background"
            type="button"
          >
            TOEIC
          </button>
          <button
            className="rounded-lg border border-border px-3.5 py-2 text-sm font-semibold text-foreground"
            type="button"
          >
            2026
          </button>
        </div>

        {isLoadingTests ? (
          <p className="text-muted-foreground">Loading tests...</p>
        ) : testsError ? (
          <div className="space-y-3">
            <p className="text-muted-foreground">{testsError}</p>
            <Button onClick={() => void reloadTests()} type="button" variant="secondary">
              Retry
            </Button>
          </div>
        ) : tests.length === 0 ? (
          <p className="text-muted-foreground">No tests available yet.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {tests.map((test) => (
              <TestCard
                key={test.id}
                onPractice={() => setSelectedTest(test)}
                test={test}
              />
            ))}
          </div>
        )}
      </Panel>

      {selectedTest ? (
        <PartPickerModal
          onClose={() => setSelectedTest(null)}
          onStart={(partNumber) => {
            router.push(`/tests/${selectedTest.id}/part/${partNumber}`);
            setSelectedTest(null);
          }}
          testLabel={selectedTest.label}
        />
      ) : null}
    </PageShell>
  );
}
