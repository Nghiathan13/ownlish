"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { AdminToeicActiveStepPanel } from "@/features/admin/toeic/detail/components/AdminToeicActiveStepPanel";
import { AdminConfirmDialog } from "@/features/admin/toeic/detail/components/editor/AdminConfirmDialog";
import { AdminGroupRawEditModal } from "@/features/admin/toeic/detail/components/editor/AdminGroupRawEditModal";
import { useAdminGroupEditor } from "@/features/admin/toeic/detail/hooks/useAdminGroupEditor";
import { useAdminToeicTestDetailQuery } from "@/features/admin/toeic/detail/hooks/useAdminToeicTestDetailQuery";
import { buildAdminToeicGridSections } from "@/features/admin/toeic/detail/lib/adminToeicQuestionGrid";
import {
  buildAdminToeicRunSteps,
  countAdminToeicQuestions,
  findAdminStepIndexForQuestionId,
  getAdminStepGroup,
  getAdminStepQuestionPosition,
  type AdminToeicRunStep,
} from "@/features/admin/toeic/detail/lib/adminToeicRunSteps";
import {
  buildAdminToeicGroupCatalog,
  findAdminGroupIndexByGroupId,
  getAdminToeicGroupCatalogEntry,
} from "@/features/admin/toeic/detail/lib/adminToeicGroupCatalog";
import { bulkSaveAdminGroupEditorStates } from "@/features/admin/toeic/detail/lib/adminGroupEditorBulkSave";
import { mergeAdminToeicGroupPatchIntoDetailCache } from "@/features/admin/toeic/detail/lib/adminToeicGroupPatchCache";
import { resolveAdminGroupSaveConfirm } from "@/features/admin/toeic/detail/lib/adminToeicGroupSaveConfirm";
import { parseAdminGroupRawEditRange } from "@/features/admin/toeic/detail/lib/adminGroupRawEditMulti";
import type { AdminGroupRawEditMode } from "@/features/admin/toeic/detail/lib/adminGroupRawEditTypes";
import type { AdminGroupRange } from "@/features/admin/toeic/detail/lib/adminGroupRawEditRange";
import type {
  AdminToeicTestRawGroup,
  AdminToeicTestRawResponse,
} from "@/features/admin/toeic/api/types";
import { useRegisterImmersiveExit } from "@/features/shell/providers/ImmersiveToolbarProvider";
import { PracticeContinuousShell } from "@/features/tests/run/components/PracticeContinuousShell";
import { PracticeNavigationButtons } from "@/features/tests/run/components/PracticeNavigationButtons";
import {
  primaryTextButtonClassName,
  secondaryTextButtonClassName,
} from "@/shared/ui/button";

type AdminToeicTestDetailPageProps = {
  testId: number;
};

type PendingNavigation =
  | { type: "back" }
  | { type: "step"; stepIndex: number };

type ConfirmKind = "discard-edit" | "save";

export function AdminToeicTestDetailPage({
  testId,
}: AdminToeicTestDetailPageProps) {
  const { data, isLoading, error } = useAdminToeicTestDetailQuery({
    enabled: true,
    testId,
  });
  const steps = useMemo(
    () => (data ? buildAdminToeicRunSteps(data.parts) : []),
    [data],
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

  if (steps.length === 0) {
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
    <AdminToeicLoadedTestDetail data={data} steps={steps} testId={testId} />
  );
}

function AdminToeicLoadedTestDetail({
  data,
  steps,
  testId,
}: {
  data: AdminToeicTestRawResponse;
  steps: AdminToeicRunStep[];
  testId: number;
}) {
  const [stepIndex, setStepIndex] = useState(0);
  const activeStepIndex = Math.min(stepIndex, steps.length - 1);
  const currentStep = steps[activeStepIndex]!;
  const currentGroup = getAdminStepGroup(currentStep);

  return (
    <AdminToeicCurrentStepDetail
      activeStepIndex={activeStepIndex}
      currentGroup={currentGroup}
      currentStep={currentStep}
      data={data}
      key={currentGroup.id}
      setStepIndex={setStepIndex}
      steps={steps}
      testId={testId}
    />
  );
}

function AdminToeicCurrentStepDetail({
  activeStepIndex,
  currentGroup,
  currentStep,
  data,
  setStepIndex,
  steps,
  testId,
}: {
  activeStepIndex: number;
  currentGroup: AdminToeicTestRawGroup;
  currentStep: AdminToeicRunStep;
  data: AdminToeicTestRawResponse;
  setStepIndex: (stepIndex: number) => void;
  steps: AdminToeicRunStep[];
  testId: number;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [isRawEditOpen, setIsRawEditOpen] = useState(false);
  const [rawEditError, setRawEditError] = useState<string | null>(null);
  const [isRawEditSaving, setIsRawEditSaving] = useState(false);
  const [isQuestionGridOpen, setIsQuestionGridOpen] = useState(false);
  const [pendingNavigation, setPendingNavigation] =
    useState<PendingNavigation | null>(null);
  const [confirmKind, setConfirmKind] = useState<ConfirmKind | null>(null);
  const totalQuestions = countAdminToeicQuestions(steps);
  const currentQuestionPosition = getAdminStepQuestionPosition(
    steps,
    activeStepIndex,
  );
  const questionGridSections = useMemo(
    () => buildAdminToeicGridSections(steps, currentStep),
    [currentStep, steps],
  );

  const handleGroupPatched = useCallback(
    (updatedGroup: AdminToeicTestRawGroup) => {
      mergeAdminToeicGroupPatchIntoDetailCache(
        queryClient,
        testId,
        updatedGroup,
      );
    },
    [queryClient, testId],
  );

  const groupCatalog = useMemo(
    () => buildAdminToeicGroupCatalog(data.parts),
    [data.parts],
  );
  const currentGroupIndex = useMemo(
    () => findAdminGroupIndexByGroupId(groupCatalog, currentGroup.id) ?? 1,
    [currentGroup.id, groupCatalog],
  );

  const editor = useAdminGroupEditor({
    group: currentGroup,
    onGroupPatched: handleGroupPatched,
  });

  const handleOpenRawEdit = useCallback(() => {
    setRawEditError(null);
    setIsRawEditOpen(true);
  }, []);

  const handleCloseRawEdit = useCallback(() => {
    if (isRawEditSaving) {
      return;
    }

    setRawEditError(null);
    setIsRawEditOpen(false);
  }, [isRawEditSaving]);

  const handleRawEditSave = useCallback(
    async (rawText: string, mode: AdminGroupRawEditMode, range: AdminGroupRange) => {
      setRawEditError(null);

      const parsed = parseAdminGroupRawEditRange(
        rawText,
        groupCatalog,
        range,
        mode,
      );

      if (!parsed.ok) {
        setRawEditError(parsed.error);
        return;
      }

      setIsRawEditSaving(true);

      try {
        const result = await bulkSaveAdminGroupEditorStates(
          parsed.items.map((item) => {
            const entry = getAdminToeicGroupCatalogEntry(groupCatalog, item.groupIndex);

            if (!entry) {
              throw new Error(`groupIndex=${item.groupIndex} is not available in this test.`);
            }

            return {
              groupIndex: item.groupIndex,
              state: item.state,
              group: entry.group,
            };
          }),
          handleGroupPatched,
        );

        const savedCurrentGroup = result.savedGroups.find(
          (group) => group.id === currentGroup.id,
        );

        if (savedCurrentGroup) {
          editor.replaceFromGroup(savedCurrentGroup);
        }

        if (result.error) {
          setRawEditError(result.error);
        }

        if (result.didSave) {
          setIsRawEditOpen(false);
        }
      } finally {
        setIsRawEditSaving(false);
      }
    },
    [currentGroup.id, editor, groupCatalog, handleGroupPatched],
  );

  const executeNavigation = useCallback(
    (navigation: PendingNavigation) => {
      if (navigation.type === "back") {
        router.push("/admin/toeic");
        return;
      }

      setStepIndex(navigation.stepIndex);
      setIsQuestionGridOpen(false);
    },
    [router, setStepIndex],
  );

  const requestNavigation = useCallback(
    (navigation: PendingNavigation) => {
      if (isEditing && editor.isDirty) {
        setPendingNavigation(navigation);
        return;
      }

      executeNavigation(navigation);
    },
    [editor.isDirty, executeNavigation, isEditing],
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

  const exitEdit = useCallback(() => {
    setIsEditing(false);
  }, []);

  const handleToolbarExit = useCallback(() => {
    if (isEditing && editor.isDirty) {
      setPendingNavigation({ type: "back" });
      return false;
    }

    return undefined;
  }, [editor.isDirty, isEditing]);

  const handleCancelEdit = useCallback(() => {
    if (editor.isDirty) {
      setConfirmKind("discard-edit");
      return;
    }

    exitEdit();
  }, [editor.isDirty, exitEdit]);

  const handleConfirmEditAction = useCallback(async () => {
    if (confirmKind === "discard-edit") {
      setConfirmKind(null);
      exitEdit();
      return;
    }

    if (confirmKind === "save") {
      await resolveAdminGroupSaveConfirm({
        closeConfirm: () => setConfirmKind(null),
        onExitEdit: exitEdit,
        save: editor.save,
      });
    }
  }, [confirmKind, editor.save, exitEdit]);

  const handleConfirmDiscardNavigation = useCallback(() => {
    if (pendingNavigation == null) {
      return;
    }

    const navigation = pendingNavigation;
    setPendingNavigation(null);
    exitEdit();
    executeNavigation(navigation);
  }, [executeNavigation, exitEdit, pendingNavigation]);

  useRegisterImmersiveExit(
    handleToolbarExit,
    `Test ${data.test.testNumber} · ${data.test.year}`,
    "/admin/toeic",
  );

  const isLastStep = activeStepIndex >= steps.length - 1;
  const navigationBar = (
    <PracticeNavigationButtons
      currentQuestionNumber={currentQuestionPosition}
      isQuestionGridOpen={isQuestionGridOpen}
      leftSlot={
        isEditing ? (
          <div className="flex items-center gap-2">
            <button
              className={secondaryTextButtonClassName()}
              disabled={editor.isSaving}
              onClick={handleCancelEdit}
              type="button"
            >
              Cancel
            </button>
            <button
              className={primaryTextButtonClassName()}
              disabled={!editor.isDirty || editor.isSaving}
              onClick={() => setConfirmKind("save")}
              type="button"
            >
              {editor.isSaving ? "Saving…" : "Save"}
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button
              className={secondaryTextButtonClassName()}
              onClick={handleOpenRawEdit}
              type="button"
            >
              Raw edit
            </button>
            <button
              className={secondaryTextButtonClassName()}
              onClick={() => setIsEditing(true)}
              type="button"
            >
              Edit
            </button>
          </div>
        )
      }
      nextAriaLabel="Next"
      nextDisabled={isLastStep}
      onNext={() => {
        goToStepIndex(activeStepIndex + 1);
      }}
      onPrevious={() => {
        goToStepIndex(activeStepIndex - 1);
      }}
      onQuestionGridOpenChange={(open) => {
        setIsQuestionGridOpen(open);
      }}
      onQuestionGridSelect={(questionId) => {
        const nextStepIndex = findAdminStepIndexForQuestionId(steps, questionId);
        if (nextStepIndex >= 0) {
          goToStepIndex(nextStepIndex);
        }
      }}
      previousDisabled={activeStepIndex === 0}
      questionGridSections={questionGridSections}
      totalQuestions={totalQuestions}
    />
  );

  return (
    <>
      <PracticeContinuousShell navigation={navigationBar}>
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <AdminToeicActiveStepPanel
            editor={editor}
            group={currentGroup}
            isEditing={isEditing}
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

      {confirmKind === "discard-edit" ? (
        <AdminConfirmDialog
          confirmLabel="Discard"
          description="Unsaved changes in this group will be lost."
          onClose={() => setConfirmKind(null)}
          onConfirm={handleConfirmEditAction}
          title="Discard changes?"
        />
      ) : null}

      {confirmKind === "save" ? (
        <AdminConfirmDialog
          confirmLabel={editor.isSaving ? "Saving…" : "Save"}
          description="Save the updated group content and questions?"
          isConfirming={editor.isSaving}
          onClose={() => setConfirmKind(null)}
          onConfirm={handleConfirmEditAction}
          title="Save changes?"
        />
      ) : null}

      {isRawEditOpen ? (
        <AdminGroupRawEditModal
          catalog={groupCatalog}
          currentGroupDraft={editor.draft}
          error={rawEditError}
          initialGroupIndex={currentGroupIndex}
          isSaving={isRawEditSaving}
          onClose={handleCloseRawEdit}
          onErrorChange={setRawEditError}
          onSave={handleRawEditSave}
        />
      ) : null}
    </>
  );
}
