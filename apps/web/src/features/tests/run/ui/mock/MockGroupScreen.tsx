"use client";

import { MockLeftPanel } from "@/features/tests/run/components/MockLeftPanel";
import { PracticeLeftPanel } from "@/features/tests/run/components/PracticeLeftPanel";
import { PracticeQuestionPrompt } from "@/features/tests/run/components/PracticeQuestionPrompt";
import { PracticeSplitPlainLayout } from "@/features/tests/run/components/PracticeSplitPlainLayout";
import { practiceSurfaceFrameClassName } from "@/features/tests/run/components/PracticeTranslationCard";
import { QuestionOptions } from "@/features/tests/run/components/QuestionOptions";
import { QuestionTranslationPanel } from "@/features/tests/run/components/QuestionTranslationPanel";
import { useImmersiveBilingual } from "@/features/shell/providers/ImmersiveToolbarProvider";
import { getPartPracticeConfig } from "@/features/tests/shared/lib/partPracticeConfig";
import {
  showsGroupContentTranslation,
  showsOptionTranslation,
  showsQuestionTranslation,
} from "@/features/tests/shared/lib/partTranslationVisibility";
import type { ToeicQuestionGroup } from "@/features/tests/shared/api/types";
import type { OptionKey } from "@/features/tests/run/lib/answerKeyMap";
import { classNames } from "@/shared/lib/classNames";

type MockGroupScreenProps = {
  group: ToeicQuestionGroup;
  isFinished: boolean;
  isTimerExpired: boolean;
  isReviewingResults: boolean;
  mediaError: string | null;
  onSelect: (toeicQuestionId: number, selectedKey: OptionKey) => void;
  partNumber: number;
};

export function MockGroupScreen({
  group,
  isFinished,
  isTimerExpired,
  isReviewingResults,
  mediaError,
  onSelect,
  partNumber,
}: MockGroupScreenProps) {
  const partConfig = getPartPracticeConfig(partNumber);
  const practiceBilingual = useImmersiveBilingual();
  const isBilingual = practiceBilingual?.isBilingual ?? false;
  const showPassageOnLeft =
    partConfig.leftPanel === "passage" ? true : isReviewingResults;

  const showGroupContentTranslation =
    isReviewingResults &&
    Boolean(group.contentVi?.trim()) &&
    showsGroupContentTranslation(partConfig);

  const leftPanel = isFinished ? (
    <PracticeLeftPanel
      audioUrl={group.audioUrl}
      group={group}
      imageUrl={group.imageUrl}
      mediaError={mediaError}
      onMediaError={() => undefined}
      partConfig={partConfig}
      partNumber={partNumber}
      plain
      questionNumber={group.questionStart}
      questionText={null}
      showContext={showPassageOnLeft}
      showContextTranslation={showGroupContentTranslation}
    />
  ) : (
    <MockLeftPanel
      group={group}
      imageUrl={group.imageUrl}
      mediaError={mediaError}
      partConfig={partConfig}
      partNumber={partNumber}
    />
  );

  const rightPanel = (
    <div className="flex flex-col gap-5">
      {group.questions.map((question) => {
        const translationVisible = isReviewingResults;
        const showInlineBilingual = isBilingual && translationVisible;
        const questionEnVisible =
          Boolean(question.question?.trim()) &&
          (isReviewingResults
            ? partConfig.showQuestionInRightPanel || translationVisible
            : true);
        const showQuestionBilingual =
          showInlineBilingual &&
          showsQuestionTranslation(partConfig.translationVariant);
        const showOptionBilingual =
          showInlineBilingual && showsOptionTranslation(partConfig.translationVariant);

        return (
          <section className="flex flex-col gap-3" key={question.id}>
            <div
              className={classNames(
                practiceSurfaceFrameClassName,
                "flex flex-col gap-3 p-4",
              )}
            >
              <PracticeQuestionPrompt
                questionNumber={question.questionNumber}
                questionText={questionEnVisible ? question.question : null}
                questionVi={question.questionVi}
                showBilingual={showQuestionBilingual}
              />
              <QuestionOptions
                answerKey={isReviewingResults ? question.answerKey : null}
                isLocked={isReviewingResults || isTimerExpired}
                onSelect={(key) => onSelect(question.id, key)}
                optionCount={question.optionCount}
                options={question.options}
                selectedKey={question.selectedKey}
                showBilingual={showOptionBilingual}
                showEnglishTextBeforeAnswer={partConfig.showOptionTextBeforeAnswer}
                showResult={isReviewingResults}
              />
            </div>
            <QuestionTranslationPanel
              answerKey={isReviewingResults ? question.answerKey : null}
              optionCount={question.optionCount}
              options={question.options}
              questionVi={question.questionVi}
              variant={partConfig.translationVariant}
              visible={translationVisible && !isBilingual}
            />
          </section>
        );
      })}
    </div>
  );

  return <PracticeSplitPlainLayout left={leftPanel} right={rightPanel} />;
}
