"use client";

import { MockLeftPanel } from "@/features/tests/run/components/MockLeftPanel";
import { PracticeLeftPanel } from "@/features/tests/run/components/PracticeLeftPanel";
import { PracticeQuestionPrompt } from "@/features/tests/run/components/PracticeQuestionPrompt";
import { PracticeSplitPlainLayout } from "@/features/tests/run/components/PracticeSplitPlainLayout";
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

type MockGroupScreenProps = {
  group: ToeicQuestionGroup;
  isFinished: boolean;
  isFinishing: boolean;
  isQuestionPending: (toeicQuestionId: number) => boolean;
  mediaError: string | null;
  onSelect: (toeicQuestionId: number, selectedKey: OptionKey) => void;
  partNumber: number;
};

export function MockGroupScreen({
  group,
  isFinished,
  isFinishing,
  isQuestionPending,
  mediaError,
  onSelect,
  partNumber,
}: MockGroupScreenProps) {
  const partConfig = getPartPracticeConfig(partNumber);
  const practiceBilingual = useImmersiveBilingual();
  const isBilingual = practiceBilingual?.isBilingual ?? false;
  const showPassageOnLeft =
    partConfig.leftPanel === "passage" ? true : isFinished;

  const showGroupContentTranslation =
    isFinished &&
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
        const translationVisible = isFinished;
        const showInlineBilingual = isBilingual && translationVisible;
        const questionEnVisible =
          Boolean(question.question?.trim()) &&
          (isFinished
            ? partConfig.showQuestionInRightPanel || translationVisible
            : true);
        const showQuestionBilingual =
          showInlineBilingual &&
          showsQuestionTranslation(partConfig.translationVariant);
        const showOptionBilingual =
          showInlineBilingual && showsOptionTranslation(partConfig.translationVariant);

        return (
          <section className="flex flex-col gap-3" key={question.id}>
            <PracticeQuestionPrompt
              questionNumber={question.questionNumber}
              questionText={questionEnVisible ? question.question : null}
              questionVi={question.questionVi}
              showBilingual={showQuestionBilingual}
            />
            <QuestionOptions
              answerKey={isFinished ? question.answerKey : null}
              isLocked={isFinished}
              isSubmitting={isFinishing}
              onSelect={(key) => onSelect(question.id, key)}
              optionCount={question.optionCount}
              options={question.options}
              selectedKey={question.selectedKey}
              showBilingual={showOptionBilingual}
              showEnglishTextBeforeAnswer={partConfig.showOptionTextBeforeAnswer}
              showResult={isFinished}
            />
            {isQuestionPending(question.id) ? (
              <p className="text-sm text-muted-foreground" role="status">
                Saving answer...
              </p>
            ) : null}
            <QuestionTranslationPanel
              answerKey={isFinished ? question.answerKey : null}
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
