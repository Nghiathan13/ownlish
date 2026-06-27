"use client";

import { PracticeLeftPanel } from "@/features/tests/run/components/PracticeLeftPanel";
import { PracticeQuestionBlock } from "@/features/tests/run/components/PracticeQuestionBlock";
import { PracticeSplitPlainLayout } from "@/features/tests/run/components/PracticeSplitPlainLayout";
import { PracticeTranslationCard } from "@/features/tests/run/components/PracticeTranslationCard";
import type { PracticeSessionController } from "@/features/tests/run/lib/practiceSessionController";
import { useDeferredGroupAnswerFlow } from "@/features/tests/run/hooks/useDeferredGroupAnswerFlow";
import { useSignedMedia } from "@/features/tests/run/hooks/useSignedMedia";
import type { PracticeGroup } from "@/features/tests/run/lib/practiceGroups";
import { getPracticeQuestionPresentation } from "@/features/tests/run/lib/practiceQuestionPresentation";
import { getPartPracticeConfig } from "@/features/tests/shared/lib/partPracticeConfig";
import { useImmersiveBilingual } from "@/features/shell/providers/ImmersiveToolbarProvider";

type PracticeGroupScreenProps = {
  testId: number;
  partNumber: number;
  practiceGroup: PracticeGroup;
  practice: PracticeSessionController;
};

export function PracticeGroupScreen({
  testId,
  partNumber,
  practiceGroup,
  practice,
}: PracticeGroupScreenProps) {
  const partConfig = getPartPracticeConfig(partNumber);
  const practiceBilingual = useImmersiveBilingual();
  const isBilingual = practiceBilingual?.isBilingual ?? false;
  const usesDeferredGroupGrading = partConfig.hideContextUntilGroupComplete;
  const usesSplitPlainLayout = partConfig.contentLayout === "split-plain";

  const signedMedia = useSignedMedia({
    testId,
    partNumber,
    group: practiceGroup.group,
  });

  const answerFlow = useDeferredGroupAnswerFlow({
    practiceGroup,
    practice,
    usesDeferredGroupGrading,
  });

  const showPassageOnLeft =
    partConfig.leftPanel === "passage" ? true : answerFlow.showGroupReveal;

  const leftPanel = (
    <PracticeLeftPanel
      audioUrl={signedMedia.audioUrl}
      group={practiceGroup.group}
      imageUrl={signedMedia.imageUrl}
      mediaError={signedMedia.mediaError}
      onMediaError={signedMedia.handleMediaError}
      partConfig={partConfig}
      partNumber={partNumber}
      plain={usesSplitPlainLayout}
      questionNumber={practiceGroup.group.questionStart}
      questionText={null}
      showContext={showPassageOnLeft}
      showContextTranslation={false}
    />
  );

  const questionBlocks = practiceGroup.questions.map((question) => {
    const presentation = getPracticeQuestionPresentation({
      question,
      answer: practice.getAnswer(question.id),
      localSelectedKey: answerFlow.getLocalSelectedKey(question.id),
      usesDeferredGroupGrading,
      showGroupReveal: answerFlow.showGroupReveal,
      partConfig,
      isBilingual,
    });

    return (
      <PracticeQuestionBlock
        isBilingual={isBilingual}
        isPartialGroupPhase={answerFlow.isPartialGroupPhase}
        key={question.id}
        onSelect={answerFlow.handleSelect}
        partConfig={partConfig}
        practice={practice}
        presentation={presentation}
        question={question}
        usesSplitPlainLayout={usesSplitPlainLayout}
      />
    );
  });

  const showGroupPassageTranslation =
    answerFlow.showGroupReveal &&
    practiceGroup.group.contentVi?.trim() &&
    (partConfig.leftPanel === "passage" ||
      partConfig.translationVariant === "content-options" ||
      partConfig.translationVariant === "content-question-options");

  const rightPanel = (
    <>
      {questionBlocks}
      {showGroupPassageTranslation ? (
        <PracticeTranslationCard>
          <p className="whitespace-pre-wrap">{practiceGroup.group.contentVi}</p>
        </PracticeTranslationCard>
      ) : null}
      {practice.hasSyncFailures ? (
        <p className="text-base text-red-600">
          Some answers could not be saved. Please retry before leaving this group.
        </p>
      ) : null}
    </>
  );

  if (usesSplitPlainLayout) {
    return (
      <PracticeSplitPlainLayout
        left={leftPanel}
        navigation={null}
        right={rightPanel}
      />
    );
  }

  return (
    <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-2">
      {leftPanel}
      <div className="flex min-h-0 flex-col gap-4 overflow-y-auto">{rightPanel}</div>
    </div>
  );
}
