"use client";

import { useState } from "react";
import type { PracticeMode } from "@/features/tests/api/types";
import { PracticeLeftPanel } from "@/features/tests/components/PracticeLeftPanel";
import { QuestionOptions } from "@/features/tests/components/QuestionOptions";
import { QuestionTranslationPanel } from "@/features/tests/components/QuestionTranslationPanel";
import type { usePracticeSession } from "@/features/tests/hooks/usePracticeSession";
import { useSignedMedia } from "@/features/tests/hooks/useSignedMedia";
import { getPartPracticeConfig } from "@/features/tests/lib/partPracticeConfig";
import type { PracticeGroup } from "@/features/tests/lib/practiceGroups";
import {
  clearPendingSelections,
  readPendingSelections,
  writePendingSelections,
  writePracticeIndex,
  type PendingSelectionsByGroup,
} from "@/features/tests/lib/practiceStorage";
import { classNames } from "@/shared/lib/classNames";
import { Button } from "@/shared/ui/Button";

type OptionKey = "A" | "B" | "C" | "D";

type FullTestContext = {
  attemptId: string;
  onPartComplete: (result: {
    correctCount: number;
    wrongCount: number;
  }) => Promise<void>;
};

type ListeningGroupPracticeContentProps = {
  testId: number;
  partNumber: number;
  practiceMode: PracticeMode;
  groups: PracticeGroup[];
  initialGroupIndex: number;
  practice: ReturnType<typeof usePracticeSession>;
  accessToken: string | null;
  clearSession: () => void;
  fullTestContext?: FullTestContext;
  onFinish: () => void;
};

function formatGroupLabel(group: PracticeGroup["group"]) {
  if (group.questionStart === group.questionEnd) {
    return `Question ${group.questionStart}`;
  }

  return `Questions ${group.questionStart}–${group.questionEnd}`;
}

export function ListeningGroupPracticeContent({
  testId,
  partNumber,
  practiceMode,
  groups,
  initialGroupIndex,
  practice,
  accessToken,
  clearSession,
  fullTestContext,
  onFinish,
}: ListeningGroupPracticeContentProps) {
  const partConfig = getPartPracticeConfig(partNumber);
  const [currentGroupIndex, setCurrentGroupIndex] = useState(initialGroupIndex);
  const [isFinishing, setIsFinishing] = useState(false);
  const [isCommittingGroup, setIsCommittingGroup] = useState(false);
  const [pendingByGroupId, setPendingByGroupId] =
    useState<PendingSelectionsByGroup>({});
  const [hydratedSessionId, setHydratedSessionId] = useState<string | null>(
    null,
  );
  const activeGroupIndex =
    groups.length === 0 ? 0 : Math.min(currentGroupIndex, groups.length - 1);
  const currentGroup = groups[activeGroupIndex] ?? null;

  const signedMedia = useSignedMedia({
    testId,
    partNumber,
    group: currentGroup?.group ?? null,
    accessToken,
    clearSession,
  });

  const sessionId = practice.sessionId;
  if (sessionId && sessionId !== hydratedSessionId) {
    setHydratedSessionId(sessionId);
    setPendingByGroupId(readPendingSelections(sessionId));
  }

  const serverSelections: Record<number, OptionKey> = {};
  if (currentGroup) {
    for (const question of currentGroup.questions) {
      const answer = practice.getAnswer(question.id);
      if (answer) {
        serverSelections[question.id] = answer.selectedKey;
      }
    }
  }

  const localSelections = currentGroup
    ? (pendingByGroupId[currentGroup.group.id] ?? {})
    : {};
  const pendingSelections = { ...serverSelections, ...localSelections };

  const updatePendingSelections = (
    groupId: number,
    updater: (current: Record<number, OptionKey>) => Record<number, OptionKey>,
  ) => {
    setPendingByGroupId((current) => {
      const nextGroupSelections = updater(current[groupId] ?? {});
      const next =
        Object.keys(nextGroupSelections).length === 0
          ? Object.fromEntries(
              Object.entries(current).filter(([id]) => Number(id) !== groupId),
            )
          : {
              ...current,
              [groupId]: nextGroupSelections,
            };

      if (sessionId) {
        writePendingSelections(sessionId, next);
      }

      return next;
    });
  };

  if (!currentGroup) {
    return null;
  }

  const allGroupCommitted = currentGroup.questions.every((question) =>
    Boolean(practice.getAnswer(question.id)),
  );
  const showGroupReveal =
    !partConfig.hideContextUntilGroupComplete || allGroupCommitted;
  const totalQuestions = groups.reduce(
    (count, group) => count + group.questions.length,
    0,
  );

  const goToGroupIndex = (index: number) => {
    const nextIndex = Math.max(0, Math.min(index, groups.length - 1));
    setCurrentGroupIndex(nextIndex);
    writePracticeIndex(testId, partNumber, nextIndex);
  };

  const commitGroupSelections = async (selections: Record<number, OptionKey>) => {
    setIsCommittingGroup(true);
    try {
      await Promise.all(
        currentGroup.questions.map(async (question) => {
          const selectedKey = selections[question.id];
          if (!selectedKey) {
            return;
          }

          const existing = practice.getAnswer(question.id);
          if (!existing) {
            await practice.submitAnswer(question.id, selectedKey);
            return;
          }

          if (existing.selectedKey !== selectedKey) {
            await practice.submitAnswer(question.id, selectedKey, {
              replace: true,
            });
          }
        }),
      );
      updatePendingSelections(currentGroup.group.id, () => ({}));
    } finally {
      setIsCommittingGroup(false);
    }
  };

  const handleSelect = (toeicQuestionId: number, key: OptionKey) => {
    if (
      showGroupReveal ||
      practice.isSubmitting ||
      isCommittingGroup ||
      allGroupCommitted
    ) {
      return;
    }

    const nextSelections = {
      ...pendingSelections,
      [toeicQuestionId]: key,
    };
    updatePendingSelections(currentGroup.group.id, (current) => ({
      ...current,
      [toeicQuestionId]: key,
    }));

    const allSelected = currentGroup.questions.every(
      (question) => nextSelections[question.id],
    );

    if (allSelected) {
      void commitGroupSelections(nextSelections);
    }
  };

  const handleFinish = async () => {
    if (isFinishing) {
      return;
    }

    setIsFinishing(true);
    try {
      const result = await practice.completeSession();

      if (sessionId) {
        clearPendingSelections(sessionId);
      }

      if (fullTestContext && result) {
        await fullTestContext.onPartComplete({
          correctCount: result.correctCount,
          wrongCount: result.wrongCount,
        });
      }

      onFinish();
    } finally {
      setIsFinishing(false);
    }
  };

  const handleNext = () => {
    if (activeGroupIndex >= groups.length - 1) {
      void handleFinish();
      return;
    }

    goToGroupIndex(activeGroupIndex + 1);
  };

  const finishLabel = fullTestContext
    ? partNumber >= 7
      ? "Finish test"
      : "Next part"
    : "Finish";

  const isInteractionDisabled =
    practice.isSubmitting || isCommittingGroup || isFinishing;

  return (
    <>
      <div>
        <p className="text-sm text-muted-foreground">
          Test {testId}
          {fullTestContext ? " · Full test" : ""} · Part {partNumber}
          {practiceMode === "wrong_questions" ? " · Review wrong" : ""}
        </p>
        <h1 className="text-xl font-semibold">
          Group {activeGroupIndex + 1} / {groups.length} ·{" "}
          {formatGroupLabel(currentGroup.group)}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {practiceMode === "wrong_questions"
            ? `Fixed ${practice.correctCount} · ${totalQuestions} questions`
            : `Correct ${practice.correctCount} · Wrong ${practice.wrongCount}`}
        </p>
      </div>

      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-2">
        <PracticeLeftPanel
          audioUrl={signedMedia.audioUrl}
          group={currentGroup.group}
          imageUrl={signedMedia.imageUrl}
          mediaError={signedMedia.mediaError}
          onMediaError={signedMedia.handleMediaError}
          partConfig={partConfig}
          questionNumber={currentGroup.group.questionStart}
          questionText={null}
          showContext={showGroupReveal}
          showContextTranslation={showGroupReveal}
        />

        <div className="flex min-h-0 flex-col gap-4 overflow-y-auto">
          {currentGroup.questions.map((question) => {
            const answer = practice.getAnswer(question.id);
            const selectedKey =
              pendingSelections[question.id] ?? answer?.selectedKey ?? null;

            return (
              <section
                className="space-y-3 rounded-xl border border-border p-4"
                key={question.id}
              >
                {question.question?.trim() ? (
                  <div>
                    <h3 className="mb-2 text-sm font-semibold">
                      Question {question.questionNumber}
                    </h3>
                    <p className="text-sm leading-relaxed select-text">
                      {question.question}
                    </p>
                  </div>
                ) : (
                  <h3 className="text-sm font-semibold">
                    Question {question.questionNumber}
                  </h3>
                )}

                <QuestionOptions
                  answerKey={showGroupReveal ? (answer?.answerKey ?? null) : null}
                  isLocked={showGroupReveal}
                  isSubmitting={isInteractionDisabled}
                  onSelect={(key) => handleSelect(question.id, key)}
                  optionCount={question.optionCount}
                  options={question.options}
                  selectedKey={selectedKey}
                  showEnglishTextBeforeAnswer={partConfig.showOptionTextBeforeAnswer}
                  showResult={showGroupReveal}
                />

                <QuestionTranslationPanel
                  optionCount={question.optionCount}
                  options={question.options}
                  questionVi={question.questionVi}
                  variant="question-options"
                  visible={showGroupReveal}
                />
              </section>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <Button
          disabled={activeGroupIndex === 0 || isFinishing}
          onClick={() => goToGroupIndex(activeGroupIndex - 1)}
          type="button"
          variant="secondary"
        >
          Prev
        </Button>
        <Button
          className={classNames(
            activeGroupIndex >= groups.length - 1 && "min-w-32",
          )}
          disabled={isInteractionDisabled}
          onClick={handleNext}
          type="button"
        >
          {activeGroupIndex >= groups.length - 1 ? finishLabel : "Next"}
        </Button>
      </div>
    </>
  );
}
