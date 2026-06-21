"use client";

import { useMemo, useState } from "react";
import { PracticeLeftPanel } from "@/features/tests/run/components/PracticeLeftPanel";
import { PracticeTranslationCard } from "@/features/tests/run/components/PracticeTranslationCard";
import { PracticeQuestionPrompt } from "@/features/tests/run/components/PracticeQuestionPrompt";
import { QuestionOptions } from "@/features/tests/run/components/QuestionOptions";
import { QuestionTranslationPanel } from "@/features/tests/run/components/QuestionTranslationPanel";
import type { usePracticeSession } from "@/features/tests/run/hooks/usePracticeSession";
import { useSignedMedia } from "@/features/tests/run/hooks/useSignedMedia";
import { isPracticeAnswerGraded } from "@/features/tests/run/lib/practiceAnswers";
import { getPartPracticeConfig } from "@/features/tests/shared/lib/partPracticeConfig";
import {
  showsOptionTranslation,
  showsQuestionTranslation,
} from "@/features/tests/shared/lib/partTranslationVisibility";
import type { PracticeGroup } from "@/features/tests/run/lib/practiceGroups";
import { writePracticeIndex } from "@/features/tests/run/lib/practiceStorage";
import { useRegisterPracticeQuestionNav } from "@/features/tests/run/hooks/useRegisterPracticeQuestionNav";
import {
  buildGroupGridSection,
  findGroupIndexForQuestion,
} from "@/features/tests/run/lib/practiceQuestionGrid";
import { resolveListeningGroupQuestionGridResult } from "@/features/tests/run/lib/resolveListeningGroupQuestionGridResult";
import { PracticeNavigationButtons } from "@/features/tests/run/components/PracticeNavigationButtons";
import { PracticeSplitPlainLayout } from "@/features/tests/run/components/PracticeSplitPlainLayout";
import { usePracticeBilingual } from "@/features/tests/run/providers/PracticeExitProvider";
import { getSessionQuestionNumber } from "@/features/tests/run/lib/sessionQuestionPosition";

type OptionKey = "A" | "B" | "C" | "D";

type PracticeGroupScreenProps = {
  testId: number;
  partNumber: number;
  groups: PracticeGroup[];
  initialGroupIndex: number;
  practice: ReturnType<typeof usePracticeSession>;
  navigation?: React.ReactNode;
};

export function PracticeGroupScreen({
  testId,
  partNumber,
  groups,
  initialGroupIndex,
  practice,
  navigation,
}: PracticeGroupScreenProps) {
  const partConfig = getPartPracticeConfig(partNumber);
  const practiceBilingual = usePracticeBilingual();
  const isBilingual = practiceBilingual?.isBilingual ?? false;
  const [currentGroupIndex, setCurrentGroupIndex] = useState(initialGroupIndex);
  const [localSelections, setLocalSelections] = useState<
    Record<number, OptionKey>
  >({});
  const [isQuestionGridOpen, setIsQuestionGridOpen] = useState(false);
  const activeGroupIndex =
    groups.length === 0 ? 0 : Math.min(currentGroupIndex, groups.length - 1);
  const currentGroup = groups[activeGroupIndex] ?? null;

  const signedMedia = useSignedMedia({
    testId,
    partNumber,
    group: currentGroup?.group ?? null,
  });

  const selectableQuestionIds = useMemo(() => {
    if (!currentGroup) {
      return [];
    }

    return currentGroup.questions
      .filter(
        (question) =>
          !isPracticeAnswerGraded(practice.getAnswer(question.id)),
      )
      .map((question) => question.id);
  }, [currentGroup, practice]);

  const activeQuestionNumbers = useMemo(() => {
    const numbers = new Set<number>();
    if (!currentGroup) {
      return numbers;
    }

    for (const question of currentGroup.questions) {
      numbers.add(question.questionNumber);
    }

    return numbers;
  }, [currentGroup]);

  const usesDeferredGroupGrading = partConfig.hideContextUntilGroupComplete;

  const questionGridSections = useMemo(() => {
    if (!currentGroup) {
      return [];
    }

    return [
      buildGroupGridSection(
        partNumber,
        groups,
        activeQuestionNumbers,
        undefined,
        (questionId) =>
          resolveListeningGroupQuestionGridResult({
            questionId,
            groups,
            usesDeferredGroupGrading,
            currentGroupId: currentGroup.group.id,
            localSelections,
            getPracticeAnswer: practice.getAnswer,
          }),
        (questionId) => {
          const answer = practice.getAnswer(questionId);
          if (isPracticeAnswerGraded(answer)) {
            return false;
          }

          return (
            localSelections[questionId] != null || answer?.selectedKey != null
          );
        },
      ),
    ];
  }, [
    activeQuestionNumbers,
    currentGroup,
    groups,
    localSelections,
    partNumber,
    practice,
    usesDeferredGroupGrading,
  ]);

  const totalQuestions = useMemo(
    () => groups.reduce((count, group) => count + group.questions.length, 0),
    [groups],
  );

  useRegisterPracticeQuestionNav({
    currentQuestionNumber: getSessionQuestionNumber(
      groups,
      currentGroup?.questions[0]?.id,
    ),
    enabled: navigation === undefined && groups.length > 0,
    totalQuestions,
  });

  if (!currentGroup) {
    return null;
  }

  const allSelectableGraded = selectableQuestionIds.every((questionId) =>
    isPracticeAnswerGraded(practice.getAnswer(questionId)),
  );
  const allSelectableSelected = selectableQuestionIds.every((questionId) => {
    const selectedKey =
      localSelections[questionId] ??
      practice.getAnswer(questionId)?.selectedKey;
    return selectedKey != null;
  });
  const showGroupReveal =
    !usesDeferredGroupGrading ||
    allSelectableSelected ||
    allSelectableGraded;
  const showPassageOnLeft =
    partConfig.leftPanel === "passage" ? true : showGroupReveal;

  const goToGroupIndex = (index: number) => {
    const nextIndex = Math.max(0, Math.min(index, groups.length - 1));
    setLocalSelections({});
    setCurrentGroupIndex(nextIndex);
    writePracticeIndex(testId, partNumber, nextIndex);
  };

  const handleSelect = (toeicQuestionId: number, key: OptionKey) => {
    if (!selectableQuestionIds.includes(toeicQuestionId)) {
      return;
    }

    if (showGroupReveal && usesDeferredGroupGrading) {
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

    const allSelected = selectableQuestionIds.every(
      (questionId) =>
        (nextSelections[questionId] ??
          practice.getAnswer(questionId)?.selectedKey) != null,
    );

    if (!allSelected) {
      practice.selectAnswer(toeicQuestionId, key, {
        deferGrade: true,
        replace: Boolean(existing?.selectedKey),
      });
      return;
    }

    const entries = selectableQuestionIds.map((questionId) => ({
      toeicQuestionId: questionId,
      selectedKey: (nextSelections[questionId] ??
        practice.getAnswer(questionId)?.selectedKey)!,
    }));
    practice.gradeGroupLocally(entries);
    setLocalSelections({});

    void practice
      .syncAnswerToServer(toeicQuestionId, key, {
        replace: Boolean(existing?.selectedKey),
      })
      .catch(() => {
        practice.rollbackGroupGrade(entries);
      });
  };

  const handleNext = () => {
    if (activeGroupIndex >= groups.length - 1) {
      return;
    }

    goToGroupIndex(activeGroupIndex + 1);
  };

  const isLastGroup = activeGroupIndex >= groups.length - 1;

  const usesSplitPlainLayout = partConfig.contentLayout === "split-plain";

  const defaultNavigationBar = (
    <PracticeNavigationButtons
      isQuestionGridOpen={isQuestionGridOpen}
      nextDisabled={isLastGroup}
      onNext={handleNext}
      onPrevious={() => goToGroupIndex(activeGroupIndex - 1)}
      onQuestionGridOpenChange={setIsQuestionGridOpen}
      onQuestionGridSelect={(questionNumber) => {
        const groupIndex = findGroupIndexForQuestion(groups, questionNumber);
        if (groupIndex >= 0) {
          goToGroupIndex(groupIndex);
        }
      }}
      previousDisabled={activeGroupIndex === 0}
      questionGridSections={questionGridSections}
    />
  );

  const navigationBar =
    navigation === undefined ? defaultNavigationBar : navigation;

  const isPartialGroupPhase =
    usesDeferredGroupGrading && !showGroupReveal;

  const leftPanel = (
    <PracticeLeftPanel
      audioUrl={signedMedia.audioUrl}
      group={currentGroup.group}
      imageUrl={signedMedia.imageUrl}
      mediaError={signedMedia.mediaError}
      onMediaError={signedMedia.handleMediaError}
      partConfig={partConfig}
      partNumber={partNumber}
      plain={usesSplitPlainLayout}
      questionNumber={currentGroup.group.questionStart}
      questionText={null}
      showContext={showPassageOnLeft}
      showContextTranslation={false}
    />
  );

  const questionBlocks = currentGroup.questions.map((question) => {
    const answer = practice.getAnswer(question.id);

    let selectedKey: OptionKey | null;
    let answerKey: OptionKey | null;
    let isLocked: boolean;
    let showResult: boolean;

    if (usesDeferredGroupGrading) {
      selectedKey = localSelections[question.id] ?? answer?.selectedKey ?? null;
      if (isPracticeAnswerGraded(answer) || showGroupReveal) {
        answerKey = answer?.answerKey ?? question.answerKey ?? null;
        isLocked = true;
        showResult = true;
      } else {
        answerKey = null;
        isLocked = false;
        showResult = false;
      }
    } else {
      selectedKey = answer?.selectedKey ?? null;
      answerKey = isPracticeAnswerGraded(answer)
        ? (answer?.answerKey ?? question.answerKey ?? null)
        : null;
      isLocked = isPracticeAnswerGraded(answer);
      showResult = isPracticeAnswerGraded(answer);
    }

    const translationVisible = usesDeferredGroupGrading
      ? showGroupReveal
      : showResult;

    const showInlineBilingual = isBilingual && translationVisible;
    const questionEnVisible =
      Boolean(question.question?.trim()) &&
      (partConfig.showQuestionInRightPanel || translationVisible);
    const showQuestionBilingual =
      showInlineBilingual &&
      translationVisible &&
      showsQuestionTranslation(partConfig.translationVariant);
    const showOptionBilingual =
      showInlineBilingual && showsOptionTranslation(partConfig.translationVariant);

    const options = (
      <>
        <QuestionOptions
          answerKey={answerKey}
          isLocked={isLocked}
          isSubmitting={
            isPartialGroupPhase
              ? false
              : practice.isQuestionPending(question.id)
          }
          onSelect={(key) => handleSelect(question.id, key)}
          optionCount={question.optionCount}
          options={question.options}
          selectedKey={selectedKey}
          showBilingual={showOptionBilingual}
          showEnglishTextBeforeAnswer={partConfig.showOptionTextBeforeAnswer}
          showResult={showResult}
        />

        <QuestionTranslationPanel
          answerKey={showResult ? answerKey : null}
          optionCount={question.optionCount}
          options={question.options}
          questionVi={question.questionVi}
          variant={partConfig.translationVariant}
          visible={translationVisible && !isBilingual}
        />
      </>
    );

    if (usesSplitPlainLayout) {
      return (
        <div className="flex flex-col gap-4" key={question.id}>
          <PracticeQuestionPrompt
            questionNumber={question.questionNumber}
            questionText={questionEnVisible ? question.question : null}
            questionVi={question.questionVi}
            showBilingual={showQuestionBilingual}
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
        <PracticeQuestionPrompt
          questionNumber={question.questionNumber}
          questionText={questionEnVisible ? question.question : null}
          questionVi={question.questionVi}
          showBilingual={showQuestionBilingual}
        />

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
    <PracticeTranslationCard>
      <p className="whitespace-pre-wrap">{currentGroup.group.contentVi}</p>
    </PracticeTranslationCard>
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
