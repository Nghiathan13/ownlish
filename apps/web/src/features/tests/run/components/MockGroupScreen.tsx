"use client";

import { MockLeftPanel } from "@/features/tests/run/components/MockLeftPanel";
import { PracticeQuestionPrompt } from "@/features/tests/run/components/PracticeQuestionPrompt";
import { PracticeSplitPlainLayout } from "@/features/tests/run/components/PracticeSplitPlainLayout";
import { QuestionOptions } from "@/features/tests/run/components/QuestionOptions";
import { getPartPracticeConfig } from "@/features/tests/shared/lib/partPracticeConfig";
import type { ToeicQuestionGroup } from "@/features/tests/shared/api/types";
import type { OptionKey } from "@/features/tests/run/lib/answerKeyMap";

type MockGroupScreenProps = {
  group: ToeicQuestionGroup;
  isFinished: boolean;
  isQuestionPending: (toeicQuestionId: number) => boolean;
  mediaError: string | null;
  onSelect: (toeicQuestionId: number, selectedKey: OptionKey) => void;
  partNumber: number;
};

export function MockGroupScreen({
  group,
  isFinished,
  isQuestionPending,
  mediaError,
  onSelect,
  partNumber,
}: MockGroupScreenProps) {
  const partConfig = getPartPracticeConfig(partNumber);
  const leftPanel = (
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
      {group.questions.map((question) => (
        <section className="flex flex-col gap-3" key={question.id}>
          <PracticeQuestionPrompt
            questionNumber={question.questionNumber}
            questionText={question.question}
          />
          <QuestionOptions
            answerKey={isFinished ? question.answerKey : null}
            isLocked={isFinished}
            isSubmitting={isQuestionPending(question.id)}
            onSelect={(key) => onSelect(question.id, key)}
            optionCount={question.optionCount}
            options={question.options}
            selectedKey={question.selectedKey}
            showEnglishTextBeforeAnswer={partConfig.showOptionTextBeforeAnswer}
            showResult={isFinished}
          />
        </section>
      ))}
    </div>
  );

  return <PracticeSplitPlainLayout left={leftPanel} right={rightPanel} />;
}
