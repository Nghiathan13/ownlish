"use client";

import { useState } from "react";
import type { PracticeMode } from "@/features/tests/api/types";
import { PracticeLeftPanel } from "@/features/tests/components/PracticeLeftPanel";
import { QuestionOptions } from "@/features/tests/components/QuestionOptions";
import { QuestionTranslationPanel } from "@/features/tests/components/QuestionTranslationPanel";
import type { usePracticeSession } from "@/features/tests/hooks/usePracticeSession";
import { useSignedMedia } from "@/features/tests/hooks/useSignedMedia";
import { isPracticeAnswerGraded } from "@/features/tests/lib/practiceAnswers";
import { getPartPracticeConfig } from "@/features/tests/lib/partPracticeConfig";
import type { PracticeGroup } from "@/features/tests/lib/practiceGroups";
import { writePracticeIndex } from "@/features/tests/lib/practiceStorage";
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

  if (!currentGroup) {
    return null;
  }

  const allGroupGraded = currentGroup.questions.every((question) =>
    isPracticeAnswerGraded(practice.getAnswer(question.id)),
  );
  const showGroupReveal =
    !partConfig.hideContextUntilGroupComplete || allGroupGraded;
  const totalQuestions = groups.reduce(
    (count, group) => count + group.questions.length,
    0,
  );

  const goToGroupIndex = (index: number) => {
    const nextIndex = Math.max(0, Math.min(index, groups.length - 1));
    setCurrentGroupIndex(nextIndex);
    writePracticeIndex(testId, partNumber, nextIndex);
  };

  const handleSelect = async (toeicQuestionId: number, key: OptionKey) => {
    if (showGroupReveal || practice.isSubmitting) {
      return;
    }

    await practice.submitAnswer(toeicQuestionId, key);
  };

  const handleFinish = async () => {
    if (isFinishing) {
      return;
    }

    setIsFinishing(true);
    try {
      if (fullTestContext) {
        await fullTestContext.onPartComplete({
          correctCount: practice.correctCount,
          wrongCount: practice.wrongCount,
        });
      } else if (practiceMode === "wrong_questions") {
        await practice.completeSession();
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
            const graded = isPracticeAnswerGraded(answer);

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
                  answerKey={graded ? (answer?.answerKey ?? null) : null}
                  isLocked={showGroupReveal}
                  isSubmitting={practice.isSubmitting || isFinishing}
                  onSelect={(key) => handleSelect(question.id, key)}
                  optionCount={question.optionCount}
                  options={question.options}
                  selectedKey={answer?.selectedKey ?? null}
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
          disabled={practice.isSubmitting || isFinishing}
          onClick={handleNext}
          type="button"
        >
          {activeGroupIndex >= groups.length - 1 ? finishLabel : "Next"}
        </Button>
      </div>
    </>
  );
}
