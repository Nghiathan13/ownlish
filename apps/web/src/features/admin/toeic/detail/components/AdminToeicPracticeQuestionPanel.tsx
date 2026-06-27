import type { AdminToeicTestRawQuestion } from "@/features/admin/toeic/api/types";
import { PracticeQuestionPrompt } from "@/features/tests/run/components/PracticeQuestionPrompt";
import { QuestionOptions } from "@/features/tests/run/components/QuestionOptions";
import { QuestionTranslationPanel } from "@/features/tests/run/components/QuestionTranslationPanel";
import {
  getAdminRawQuestionOptionCount,
  mapAdminRawQuestionToOptions,
} from "@/features/admin/toeic/detail/lib/mapAdminRawQuestion";
import { getPartPracticeConfig } from "@/features/tests/shared/lib/partPracticeConfig";

type AdminToeicPracticeQuestionPanelProps = {
  partNumber: number;
  questions: AdminToeicTestRawQuestion[];
};

function AdminToeicPracticeQuestionBlock({
  partNumber,
  question,
}: {
  partNumber: number;
  question: AdminToeicTestRawQuestion;
}) {
  const partConfig = getPartPracticeConfig(partNumber);
  const options = mapAdminRawQuestionToOptions(question);
  const optionCount = getAdminRawQuestionOptionCount(question);
  const answerKey = question.answerKey;
  const questionEnVisible =
    partConfig.showQuestionInRightPanel && Boolean(question.question?.trim());

  return (
    <div className="flex flex-col gap-4">
      <PracticeQuestionPrompt
        questionNumber={question.questionNumber}
        questionText={questionEnVisible ? question.question : null}
        questionVi={question.questionVi}
        showBilingual={false}
      />
      <QuestionOptions
        answerKey={answerKey}
        isLocked
        onSelect={() => undefined}
        optionCount={optionCount}
        options={options}
        selectedKey={answerKey}
        showBilingual={false}
        showEnglishTextBeforeAnswer={partConfig.showOptionTextBeforeAnswer}
        showResult
      />
      <QuestionTranslationPanel
        answerKey={answerKey}
        optionCount={optionCount}
        options={options}
        questionVi={question.questionVi}
        variant={partConfig.translationVariant}
        visible
      />
      {question.explanationVi?.trim() ? (
        <p className="whitespace-pre-wrap text-base text-foreground select-text">
          {question.explanationVi}
        </p>
      ) : null}
    </div>
  );
}

export function AdminToeicPracticeQuestionPanel({
  partNumber,
  questions,
}: AdminToeicPracticeQuestionPanelProps) {
  return (
    <div className="flex flex-col gap-5">
      {questions.map((question) => (
        <AdminToeicPracticeQuestionBlock
          key={question.id}
          partNumber={partNumber}
          question={question}
        />
      ))}
    </div>
  );
}
