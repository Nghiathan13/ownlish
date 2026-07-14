"use client";

import { PracticeLeftPanel } from "@/features/tests/run/components/PracticeLeftPanel";
import { PracticeSplitPlainLayout } from "@/features/tests/run/components/PracticeSplitPlainLayout";
import type { PracticeSessionController } from "@/features/tests/run/model/practice/practiceSessionController";
import { useDeferredGroupAnswerFlow } from "@/features/tests/run/model/practice/useDeferredGroupAnswerFlow";
import { PracticeQuestionBlock } from "@/features/tests/run/ui/practice/PracticeQuestionBlock";
import { PracticeSubmissionAlert } from "@/features/tests/run/ui/practice/PracticeSubmissionAlert";
import { useSignedMedia } from "@/features/tests/run/hooks/useSignedMedia";
import type { PracticeGroup } from "@/features/tests/run/lib/practiceGroups";
import { getPracticeQuestionPresentation } from "@/features/tests/run/lib/practiceQuestionPresentation";
import { getPartPracticeConfig } from "@/features/tests/shared/lib/partPracticeConfig";
import { showsGroupContentTranslation } from "@/features/tests/shared/lib/partTranslationVisibility";
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

  const showGroupContentTranslation =
    answerFlow.showGroupReveal &&
    Boolean(practiceGroup.group.contentVi?.trim()) &&
    showsGroupContentTranslation(partConfig);

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
      showContextTranslation={showGroupContentTranslation}
    />
  );

  const questionBlocks = practiceGroup.questions.map((question) => {
    const presentation = getPracticeQuestionPresentation({
      question,
      answer: practice.getAnswer(question.id),
      localSelectedKey: answerFlow.getLocalSelectedKey(question.id),
      usesDeferredGroupGrading,
      showGroupReveal: answerFlow.showGroupReveal,
      isDeferredGroupPending: answerFlow.isGroupPending,
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

  const rightPanel = (
    <>
      {questionBlocks}
      {practice.hasSyncFailures ? (
        <PracticeSubmissionAlert
          isSubmitting={practice.isSubmitting}
          onRetry={practice.retryFailedAnswers}
        />
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
      <div className="flex min-h-0 flex-col gap-4 overflow-y-auto">
        {rightPanel}
      </div>
    </div>
  );
}
