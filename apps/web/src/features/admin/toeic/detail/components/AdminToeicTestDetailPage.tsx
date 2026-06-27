"use client";

import { useCallback, useMemo, useState, type MouseEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { AdminToeicActiveStepPanel } from "@/features/admin/toeic/detail/components/AdminToeicActiveStepPanel";
import { AdminConfirmDialog } from "@/features/admin/toeic/detail/components/editor/AdminConfirmDialog";
import {
  getAdminToeicTestDetailQueryKey,
  useAdminToeicTestDetailQuery,
} from "@/features/admin/toeic/detail/hooks/useAdminToeicTestDetailQuery";
import { buildAdminToeicGridSections } from "@/features/admin/toeic/detail/lib/adminToeicQuestionGrid";
import {
  buildAdminToeicRunSteps,
  countAdminToeicQuestions,
  findAdminStepIndexForQuestionId,
  getAdminStepGroup,
  getAdminStepQuestionPosition,
} from "@/features/admin/toeic/detail/lib/adminToeicRunSteps";
import { replaceGroupInTestDetail } from "@/features/admin/toeic/detail/lib/applyAdminEditsToCache";
import type {
  AdminToeicTestRawGroup,
  AdminToeicTestRawResponse,
} from "@/features/admin/toeic/api/types";
import { PracticeContinuousShell } from "@/features/tests/run/components/PracticeContinuousShell";
import { PracticeNavigationButtons } from "@/features/tests/run/components/PracticeNavigationButtons";
import { secondaryTextButtonClassName } from "@/shared/ui/button";

type AdminToeicTestDetailPageProps = {
  testId: number;
};

type PendingNavigation =
  | { type: "back" }
  | { type: "step"; stepIndex: number };

export function AdminToeicTestDetailPage({ testId }: AdminToeicTestDetailPageProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useAdminToeicTestDetailQuery({
    enabled: true,
    testId,
  });
  const [stepIndex, setStepIndex] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [isQuestionGridOpen, setIsQuestionGridOpen] = useState(false);
  const [pendingNavigation, setPendingNavigation] =
    useState<PendingNavigation | null>(null);

  const steps = useMemo(
    () => (data ? buildAdminToeicRunSteps(data.parts) : []),
    [data],
  );
  const activeStepIndex =
    steps.length === 0 ? 0 : Math.min(stepIndex, steps.length - 1);
  const currentStep = steps[activeStepIndex] ?? null;
  const currentGroup = currentStep ? getAdminStepGroup(currentStep) : null;
  const totalQuestions = countAdminToeicQuestions(steps);
  const currentQuestionPosition = getAdminStepQuestionPosition(
    steps,
    activeStepIndex,
  );

  const questionGridSections = useMemo(
    () => buildAdminToeicGridSections(steps, currentStep),
    [currentStep, steps],
  );

  const executeNavigation = useCallback((navigation: PendingNavigation) => {
    if (navigation.type === "back") {
      router.push("/admin/toeic");
      return;
    }

    setStepIndex(navigation.stepIndex);
    setIsQuestionGridOpen(false);
  }, [router]);

  const requestNavigation = useCallback(
    (navigation: PendingNavigation) => {
      if (isEditing && isDirty) {
        setPendingNavigation(navigation);
        return;
      }

      if (isEditing) {
        setIsEditing(false);
        setIsDirty(false);
      }

      executeNavigation(navigation);
    },
    [executeNavigation, isDirty, isEditing],
  );

  const goToStepIndex = useCallback(
    (nextIndex: number) => {
      if (nextIndex === activeStepIndex) {
        return;
      }

      requestNavigation({ type: "step", stepIndex: nextIndex });
    },
    [activeStepIndex, requestNavigation],
  );

  const handleConfirmDiscardNavigation = useCallback(() => {
    if (pendingNavigation == null) {
      return;
    }

    const navigation = pendingNavigation;
    setPendingNavigation(null);
    setIsEditing(false);
    setIsDirty(false);
    executeNavigation(navigation);
  }, [executeNavigation, pendingNavigation]);

  const handleSaved = useCallback(
    (updatedGroup: AdminToeicTestRawGroup) => {
      queryClient.setQueryData<AdminToeicTestRawResponse>(
        getAdminToeicTestDetailQueryKey(testId),
        (current) =>
          current ? replaceGroupInTestDetail(current, updatedGroup) : current,
      );
      setIsDirty(false);
      setIsEditing(false);
    },
    [queryClient, testId],
  );

  const handleBackClick = useCallback(
    (event: MouseEvent<HTMLAnchorElement>) => {
      if (!isEditing || !isDirty) {
        return;
      }

      event.preventDefault();
      requestNavigation({ type: "back" });
    },
    [isDirty, isEditing, requestNavigation],
  );

  const isLastStep = activeStepIndex >= steps.length - 1;
  const navigationBar = (
    <PracticeNavigationButtons
      isQuestionGridOpen={isQuestionGridOpen}
      nextAriaLabel="Next"
      nextDisabled={isLastStep}
      onNext={() => {
        goToStepIndex(activeStepIndex + 1);
      }}
      onPrevious={() => {
        goToStepIndex(activeStepIndex - 1);
      }}
      onQuestionGridOpenChange={(open) => {
        if (!open) {
          setIsQuestionGridOpen(false);
          return;
        }

        setIsQuestionGridOpen(true);
      }}
      onQuestionGridSelect={(questionId) => {
        const nextStepIndex = findAdminStepIndexForQuestionId(steps, questionId);
        if (nextStepIndex >= 0) {
          goToStepIndex(nextStepIndex);
        }
      }}
      previousDisabled={activeStepIndex === 0}
      questionGridSections={questionGridSections}
    />
  );

  if (isLoading) {
    return (
      <div className="px-4 py-6">
        <p className="text-muted-foreground">Loading test content…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-4 py-6">
        <p className="text-muted-foreground">Cannot load this test.</p>
      </div>
    );
  }

  if (data == null) {
    return (
      <div className="px-4 py-6">
        <p className="text-muted-foreground">Test not found.</p>
      </div>
    );
  }

  if (steps.length === 0 || currentStep == null || currentGroup == null) {
    return (
      <div className="px-4 py-6">
        <Link className={secondaryTextButtonClassName()} href="/admin/toeic">
          Back to TOEIC Content
        </Link>
        <p className="mt-4 text-muted-foreground">This test has no content.</p>
      </div>
    );
  }

  return (
    <>
      <PracticeContinuousShell navigation={navigationBar}>
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 py-4">
          <div className="mb-4 flex flex-col gap-2">
            <Link
              className={secondaryTextButtonClassName()}
              href="/admin/toeic"
              onClick={handleBackClick}
            >
              Back to TOEIC Content
            </Link>
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h1 className="text-2xl font-bold leading-tight">
                  Test {data.test.testNumber} · {data.test.year}
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Test ID {data.test.id}
                </p>
              </div>
              <p className="text-sm font-medium text-foreground">
                Question {currentQuestionPosition} / {totalQuestions}
              </p>
            </div>
          </div>

          <AdminToeicActiveStepPanel
            group={currentGroup}
            isEditing={isEditing}
            onDirtyChange={setIsDirty}
            onExitEdit={() => {
              setIsEditing(false);
              setIsDirty(false);
            }}
            onRequestEdit={() => setIsEditing(true)}
            onSaved={handleSaved}
            step={currentStep}
          />
        </div>
      </PracticeContinuousShell>

      {pendingNavigation != null ? (
        <AdminConfirmDialog
          confirmLabel="Discard and continue"
          description="The current group has unsaved changes. Discard them and continue?"
          onClose={() => setPendingNavigation(null)}
          onConfirm={handleConfirmDiscardNavigation}
          title="Discard changes?"
        />
      ) : null}
    </>
  );
}
