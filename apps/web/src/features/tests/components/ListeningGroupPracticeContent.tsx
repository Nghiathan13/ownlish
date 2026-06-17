"use client";

import { useMemo, useState } from "react";
import type { PracticeMode } from "@/features/tests/api/types";
import { PracticeLeftPanel } from "@/features/tests/components/PracticeLeftPanel";
import { PracticeQuestionPrompt } from "@/features/tests/components/PracticeQuestionPrompt";
import { QuestionOptions } from "@/features/tests/components/QuestionOptions";
import { QuestionTranslationPanel } from "@/features/tests/components/QuestionTranslationPanel";
import type { usePracticeSession } from "@/features/tests/hooks/usePracticeSession";
import { useSignedMedia } from "@/features/tests/hooks/useSignedMedia";
import { isPracticeAnswerGraded } from "@/features/tests/lib/practiceAnswers";
import { getPartPracticeConfig } from "@/features/tests/lib/partPracticeConfig";
import type { PracticeGroup } from "@/features/tests/lib/practiceGroups";
import { writePracticeIndex } from "@/features/tests/lib/practiceStorage";
import { PracticeNavigationButtons } from "@/features/tests/components/PracticeNavigationButtons";
import { PracticeSplitPlainLayout } from "@/features/tests/components/PracticeSplitPlainLayout";

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
  normalPractice?: ReturnType<typeof usePracticeSession>;
  wrongQuestionCount?: number;
  accessToken: string | null;
  clearSession: () => void;
  fullTestContext?: FullTestContext;
  onFinish: () => void;
  navigation?: React.ReactNode;
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
  normalPractice,
  wrongQuestionCount,
  accessToken,
  clearSession,
  fullTestContext,
  onFinish,
  navigation,
}: ListeningGroupPracticeContentProps) {
  const partConfig = getPartPracticeConfig(partNumber);
  const isWrongGroupReview =
    practiceMode === "wrong_questions" && normalPractice != null;
  const [currentGroupIndex, setCurrentGroupIndex] = useState(initialGroupIndex);
  const [localSelections, setLocalSelections] = useState<
    Record<number, OptionKey>
  >({});
  const [lockedReviewGroupIds, setLockedReviewGroupIds] = useState<
    Set<number>
  >(() => new Set());
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

  const editableQuestionIds = useMemo(() => {
    if (!currentGroup || !isWrongGroupReview) {
      return [];
    }

    return currentGroup.questions
      .filter(
        (question) => normalPractice.getAnswer(question.id)?.isCorrect !== true,
      )
      .map((question) => question.id);
  }, [currentGroup, isWrongGroupReview, normalPractice]);

  if (!currentGroup) {
    return null;
  }

  const allGroupGraded = currentGroup.questions.every((question) =>
    isPracticeAnswerGraded(practice.getAnswer(question.id)),
  );
  const allQuestionsSelected = currentGroup.questions.every((question) => {
    const selectedKey =
      localSelections[question.id] ??
      practice.getAnswer(question.id)?.selectedKey;
    return selectedKey != null;
  });
  const allEditableGraded = editableQuestionIds.every((questionId) =>
    isPracticeAnswerGraded(practice.getAnswer(questionId)),
  );
  const usesDeferredGroupGrading = partConfig.hideContextUntilGroupComplete;
  const isReviewGroupLocked =
    isWrongGroupReview &&
    (lockedReviewGroupIds.has(currentGroup.group.id) || allEditableGraded);
  const showGroupReveal = isWrongGroupReview
    ? isReviewGroupLocked
    : !usesDeferredGroupGrading || allQuestionsSelected || allGroupGraded;
  const showPassageOnLeft =
    partConfig.leftPanel === "passage" ? true : showGroupReveal;
  const totalQuestions =
    isWrongGroupReview && wrongQuestionCount != null
      ? wrongQuestionCount
      : groups.reduce((count, group) => count + group.questions.length, 0);

  const goToGroupIndex = (index: number) => {
    const nextIndex = Math.max(0, Math.min(index, groups.length - 1));
    setLocalSelections({});
    setCurrentGroupIndex(nextIndex);
    writePracticeIndex(testId, partNumber, nextIndex);
  };

  const handleSelect = (toeicQuestionId: number, key: OptionKey) => {
    if (isFinishing) {
      return;
    }

    if (isWrongGroupReview) {
      const wasCorrectInNormal =
        normalPractice.getAnswer(toeicQuestionId)?.isCorrect === true;

      if (wasCorrectInNormal) {
        return;
      }

      if (isReviewGroupLocked) {
        return;
      }

      const nextSelections = {
        ...localSelections,
        [toeicQuestionId]: key,
      };
      setLocalSelections(nextSelections);

      const allEditableSelected = editableQuestionIds.every(
        (questionId) => nextSelections[questionId] != null,
      );

      if (!allEditableSelected) {
        return;
      }

      const entries = editableQuestionIds.map((questionId) => ({
        toeicQuestionId: questionId,
        selectedKey: nextSelections[questionId]!,
      }));
      const groupId = currentGroup.group.id;

      practice.gradeGroupLocally(entries);
      setLockedReviewGroupIds((current) => new Set(current).add(groupId));

      void practice
        .submitReviewGroupAnswersBatch(groupId, entries)
        .then(() => {
          setLocalSelections({});
        })
        .catch(() => {
          practice.rollbackGroupGrade(entries);
          setLockedReviewGroupIds((current) => {
            const next = new Set(current);
            next.delete(groupId);
            return next;
          });
        });
      return;
    }

    if (usesDeferredGroupGrading) {
      if (showGroupReveal) {
        return;
      }

      const existing = practice.getAnswer(toeicQuestionId);
      const currentSelectedKey =
        localSelections[toeicQuestionId] ?? existing?.selectedKey;
      if (currentSelectedKey === key) {
        return;
      }

      const nextSelections = {
        ...localSelections,
        [toeicQuestionId]: key,
      };
      setLocalSelections(nextSelections);

      const allSelected = currentGroup.questions.every((question) => {
        const selectedKey =
          question.id === toeicQuestionId
            ? key
            : (nextSelections[question.id] ??
              practice.getAnswer(question.id)?.selectedKey);
        return selectedKey != null;
      });

      if (allSelected) {
        const entries = currentGroup.questions.map((question) => ({
          toeicQuestionId: question.id,
          selectedKey: (question.id === toeicQuestionId
            ? key
            : (nextSelections[question.id] ??
              practice.getAnswer(question.id)?.selectedKey))!,
        }));
        practice.gradeGroupLocally(entries);
        setLocalSelections({});
        void practice.syncAnswerToServer(toeicQuestionId, key, {
          replace: Boolean(existing?.selectedKey),
        });
        return;
      }

      practice.selectAnswer(toeicQuestionId, key, {
        deferGrade: true,
        replace: Boolean(existing?.selectedKey),
        selectionOnly: true,
      });
      return;
    }

    if (isPracticeAnswerGraded(practice.getAnswer(toeicQuestionId))) {
      return;
    }

    practice.selectAnswer(toeicQuestionId, key);
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
    const isLastGroup = activeGroupIndex >= groups.length - 1;

    if (fullTestContext && isLastGroup) {
      void handleFinish();
      return;
    }

    if (!isLastGroup) {
      goToGroupIndex(activeGroupIndex + 1);
    }
  };

  const isLastGroup = activeGroupIndex >= groups.length - 1;

  const finishLabel = fullTestContext
    ? partNumber >= 7
      ? "Finish test"
      : "Next part"
    : "Finish";

  const usesSplitPlainLayout = partConfig.contentLayout === "split-plain";

  const navigationBar = navigation ?? (
    <PracticeNavigationButtons
      nextAriaLabel={fullTestContext && isLastGroup ? finishLabel : "Next"}
      nextDisabled={isFinishing || (isLastGroup && !fullTestContext)}
      onNext={handleNext}
      onPrevious={() => goToGroupIndex(activeGroupIndex - 1)}
      previousDisabled={activeGroupIndex === 0 || isFinishing}
    />
  );

  const isPartialGroupPhase =
    usesDeferredGroupGrading && !showGroupReveal && !isWrongGroupReview;

  const leftPanel = (
    <PracticeLeftPanel
      audioUrl={signedMedia.audioUrl}
      group={currentGroup.group}
      imageUrl={signedMedia.imageUrl}
      mediaError={signedMedia.mediaError}
      onMediaError={signedMedia.handleMediaError}
      partConfig={partConfig}
      plain={usesSplitPlainLayout}
      questionNumber={currentGroup.group.questionStart}
      questionText={null}
      showContext={showPassageOnLeft}
      showContextTranslation={false}
    />
  );

  const questionBlocks = currentGroup.questions.map((question) => {
    const reviewAnswer = practice.getAnswer(question.id);
    const normalAnswer = normalPractice?.getAnswer(question.id);
    const wasCorrectInNormal = normalAnswer?.isCorrect === true;

    let selectedKey: OptionKey | null;
    let answerKey: OptionKey | null;
    let isLocked: boolean;
    let showResult: boolean;

    if (isWrongGroupReview) {
      selectedKey = wasCorrectInNormal
        ? (normalAnswer?.selectedKey ?? null)
        : isReviewGroupLocked
          ? (reviewAnswer?.selectedKey ??
            localSelections[question.id] ??
            null)
          : (localSelections[question.id] ??
            reviewAnswer?.selectedKey ??
            normalAnswer?.selectedKey ??
            null);
      answerKey = wasCorrectInNormal
        ? (normalAnswer?.answerKey ?? null)
        : isReviewGroupLocked
          ? (reviewAnswer?.answerKey ?? question.answerKey ?? null)
          : null;
      isLocked = wasCorrectInNormal || isReviewGroupLocked;
      showResult = wasCorrectInNormal || isReviewGroupLocked;
    } else if (usesDeferredGroupGrading) {
      selectedKey =
        localSelections[question.id] ?? reviewAnswer?.selectedKey ?? null;
      if (showGroupReveal) {
        answerKey = reviewAnswer?.answerKey ?? question.answerKey ?? null;
        isLocked = true;
        showResult = true;
      } else {
        answerKey = null;
        isLocked = false;
        showResult = false;
      }
    } else {
      selectedKey = reviewAnswer?.selectedKey ?? null;
      answerKey = isPracticeAnswerGraded(reviewAnswer)
        ? (reviewAnswer?.answerKey ?? question.answerKey ?? null)
        : null;
      isLocked = isPracticeAnswerGraded(reviewAnswer);
      showResult = isPracticeAnswerGraded(reviewAnswer);
    }

    const translationVisible = showGroupReveal;

    const options = (
      <>
        <QuestionOptions
          answerKey={answerKey}
          isLocked={isLocked}
          isSubmitting={
            isPartialGroupPhase
              ? isFinishing
              : practice.isQuestionPending(question.id) || isFinishing
          }
          onSelect={(key) => handleSelect(question.id, key)}
          optionCount={question.optionCount}
          options={question.options}
          selectedKey={selectedKey}
          showEnglishTextBeforeAnswer={partConfig.showOptionTextBeforeAnswer}
          showResult={showResult}
        />

        <QuestionTranslationPanel
          optionCount={question.optionCount}
          options={question.options}
          questionVi={question.questionVi}
          variant={partConfig.translationVariant}
          visible={translationVisible}
        />
      </>
    );

    if (usesSplitPlainLayout) {
      return (
        <div className="flex flex-col gap-4" key={question.id}>
          <PracticeQuestionPrompt
            questionNumber={question.questionNumber}
            questionText={
              partConfig.showQuestionInRightPanel ? question.question : null
            }
          />
          {options}
        </div>
      );
    }

    return (
      <section
        className="space-y-3 rounded-xl border border-border p-4"
        key={question.id}
      >
        {partConfig.showQuestionInRightPanel && question.question?.trim() ? (
          <div>
            <h3 className="mb-2 text-base font-semibold">
              Question {question.questionNumber}
            </h3>
            <p className="text-base leading-relaxed select-text">
              {question.question}
            </p>
          </div>
        ) : (
          <h3 className="text-base font-semibold">
            Question {question.questionNumber}
          </h3>
        )}

        {options}
      </section>
    );
  });

  const showGroupPassageTranslation =
    showGroupReveal &&
    currentGroup.group.contentVi?.trim() &&
    (partConfig.leftPanel === "passage" ||
      partConfig.translationVariant === "content-options" ||
      partConfig.translationVariant === "content-question-options");

  const groupPassageTranslation = showGroupPassageTranslation ? (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-muted/40 p-4 text-base text-foreground select-text">
      <p className="font-semibold">Translations</p>
      <p className="whitespace-pre-wrap">{currentGroup.group.contentVi}</p>
    </div>
  ) : null;

  const syncFailureBanner = practice.hasSyncFailures ? (
    <p className="text-base text-red-600">
      Some answers could not be saved. Please retry before leaving this group.
    </p>
  ) : null;

  if (usesSplitPlainLayout) {
    return (
      <PracticeSplitPlainLayout
        left={leftPanel}
        navigation={navigationBar}
        right={
          <>
            {questionBlocks}
            {groupPassageTranslation}
            {syncFailureBanner}
          </>
        }
      />
    );
  }

  return (
    <>
      <div>
        <p className="text-base text-muted-foreground">
          Test {testId}
          {fullTestContext ? " · Full test" : ""} · Part {partNumber}
          {practiceMode === "wrong_questions" ? " · Review wrong" : ""}
        </p>
        <h1 className="text-xl font-semibold">
          Group {activeGroupIndex + 1} / {groups.length} ·{" "}
          {formatGroupLabel(currentGroup.group)}
        </h1>
        <p className="mt-1 text-base text-muted-foreground">
          {practiceMode === "wrong_questions"
            ? `Fixed ${practice.correctCount} · ${totalQuestions} questions`
            : `Correct ${practice.correctCount} · Wrong ${practice.wrongCount}`}
        </p>
      </div>

      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-2">
        {leftPanel}

        <div className="flex min-h-0 flex-col gap-4 overflow-y-auto">
          {questionBlocks}
          {groupPassageTranslation}
          {syncFailureBanner}
        </div>
      </div>

      {navigationBar}
    </>
  );
}
