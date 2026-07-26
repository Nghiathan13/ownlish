"use client";

import { PracticeQuestionPrompt } from "@/features/tests/run/components/PracticeQuestionPrompt";
import { practiceSurfaceFrameClassName } from "@/features/tests/run/components/PracticeTranslationCard";
import { QuestionOptions } from "@/features/tests/run/components/QuestionOptions";
import { QuestionTranslationPanel } from "@/features/tests/run/components/QuestionTranslationPanel";
import type { PracticeSessionController } from "@/features/tests/run/model/practice/practiceSessionController";
import type { PracticeQuestionPresentation } from "@/features/tests/run/lib/practiceQuestionPresentation";
import type { PartPracticeConfig } from "@/features/tests/shared/constants/partPracticeConfig";
import type { ToeicQuestion } from "@/entities/toeic-runtime/model/presentation";
import type { OptionKey } from "@/features/tests/run/lib/answerKeyMap";
import { classNames } from "@/shared/lib/classNames";

type PracticeQuestionBlockProps = {
  question: ToeicQuestion;
  presentation: PracticeQuestionPresentation;
  partConfig: PartPracticeConfig;
  practice: PracticeSessionController;
  isPartialGroupPhase: boolean;
  usesSplitPlainLayout: boolean;
  isBilingual: boolean;
  onSelect: (questionId: number, key: OptionKey) => void;
};

export function PracticeQuestionBlock({
  question,
  presentation,
  partConfig,
  practice,
  isPartialGroupPhase,
  usesSplitPlainLayout,
  isBilingual,
  onSelect,
}: PracticeQuestionBlockProps) {
  const contentGapClassName = usesSplitPlainLayout ? "gap-4" : "gap-3";

  const questionCard = (
    <div
      className={classNames(
        practiceSurfaceFrameClassName,
        "flex flex-col p-4",
        contentGapClassName,
      )}
    >
      <PracticeQuestionPrompt
        questionNumber={question.questionNumber}
        questionText={presentation.questionEnVisible ? question.question : null}
        questionVi={question.questionVi}
        showBilingual={presentation.showQuestionBilingual}
      />
      <QuestionOptions
        answerKey={presentation.answerKey}
        isLocked={presentation.isLocked}
        isSubmitting={
          isPartialGroupPhase ? false : practice.isQuestionPending(question.id)
        }
        onSelect={(key) => onSelect(question.id, key)}
        optionCount={question.optionCount}
        options={question.options}
        selectedKey={presentation.selectedKey}
        showBilingual={presentation.showOptionBilingual}
        showEnglishTextBeforeAnswer={partConfig.showOptionTextBeforeAnswer}
        showResult={presentation.showResult}
      />
    </div>
  );

  return (
    <div
      className={classNames("flex flex-col", contentGapClassName)}
      key={question.id}
    >
      {questionCard}
      <QuestionTranslationPanel
        answerKey={presentation.showResult ? presentation.answerKey : null}
        optionCount={question.optionCount}
        options={question.options}
        questionVi={question.questionVi}
        variant={partConfig.translationVariant}
        visible={presentation.translationVisible && !isBilingual}
      />
    </div>
  );
}
