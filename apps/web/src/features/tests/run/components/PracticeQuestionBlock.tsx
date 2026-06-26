"use client";

import { PracticeQuestionPrompt } from "@/features/tests/run/components/PracticeQuestionPrompt";
import { QuestionOptions } from "@/features/tests/run/components/QuestionOptions";
import { QuestionTranslationPanel } from "@/features/tests/run/components/QuestionTranslationPanel";
import type { PracticeSessionController } from "@/features/tests/run/lib/practiceSessionController";
import type { PracticeQuestionPresentation } from "@/features/tests/run/lib/practiceQuestionPresentation";
import type { PartPracticeConfig } from "@/features/tests/shared/constants/partPracticeConfig";
import type { ToeicQuestion } from "@/entities/toeic/api/types";
import type { OptionKey } from "@/features/tests/run/lib/answerKeyMap";

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
  const options = (
    <>
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

      <QuestionTranslationPanel
        answerKey={presentation.showResult ? presentation.answerKey : null}
        optionCount={question.optionCount}
        options={question.options}
        questionVi={question.questionVi}
        variant={partConfig.translationVariant}
        visible={presentation.translationVisible && !isBilingual}
      />
    </>
  );

  if (usesSplitPlainLayout) {
    return (
      <div className="flex flex-col gap-4" key={question.id}>
        <PracticeQuestionPrompt
          questionNumber={question.questionNumber}
          questionText={presentation.questionEnVisible ? question.question : null}
          questionVi={question.questionVi}
          showBilingual={presentation.showQuestionBilingual}
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
        questionText={presentation.questionEnVisible ? question.question : null}
        questionVi={question.questionVi}
        showBilingual={presentation.showQuestionBilingual}
      />
      {options}
    </section>
  );
}
