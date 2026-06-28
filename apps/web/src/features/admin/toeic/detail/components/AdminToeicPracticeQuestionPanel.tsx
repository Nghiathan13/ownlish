import type { AdminToeicTestRawQuestion } from "@/features/admin/toeic/api/types";
import { PracticeQuestionPrompt } from "@/features/tests/run/components/PracticeQuestionPrompt";
import { QuestionOptions } from "@/features/tests/run/components/QuestionOptions";
import {
  getAdminRawQuestionOptionCount,
  mapAdminRawQuestionToOptions,
} from "@/features/admin/toeic/detail/lib/mapAdminRawQuestion";
import { getPartPracticeConfig } from "@/features/tests/shared/lib/partPracticeConfig";
import {
  showsOptionTranslation,
  showsQuestionTranslation,
} from "@/features/tests/shared/lib/partTranslationVisibility";

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
    Boolean(question.question?.trim()) &&
    (partConfig.showQuestionInRightPanel || partNumber === 2);
  const showQuestionBilingual =
    showsQuestionTranslation(partConfig.translationVariant) &&
    Boolean(question.questionVi?.trim());
  const showOptionBilingual = showsOptionTranslation(
    partConfig.translationVariant,
  );

  return (
    <div className="flex flex-col gap-4">
      <PracticeQuestionPrompt
        plainTranslation
        questionNumber={question.questionNumber}
        questionText={questionEnVisible ? question.question : null}
        questionVi={question.questionVi}
        showBilingual={showQuestionBilingual}
      />
      <QuestionOptions
        answerKey={answerKey}
        isLocked
        onSelect={() => undefined}
        optionCount={optionCount}
        options={options}
        plainTranslation
        selectedKey={answerKey}
        showBilingual={showOptionBilingual}
        showEnglishTextBeforeAnswer={partConfig.showOptionTextBeforeAnswer}
        showResult
      />
      {question.explanationVi?.trim() ? (
        <p className="whitespace-pre-wrap text-base text-muted-foreground select-text">
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
