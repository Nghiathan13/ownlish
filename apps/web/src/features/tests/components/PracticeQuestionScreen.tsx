"use client";

import type { PracticeMode } from "@/features/tests/api/types";
import { PracticeLeftPanel } from "@/features/tests/components/PracticeLeftPanel";
import { PracticeQuestionPrompt } from "@/features/tests/components/PracticeQuestionPrompt";
import { PracticeSplitPlainLayout } from "@/features/tests/components/PracticeSplitPlainLayout";
import { QuestionOptions } from "@/features/tests/components/QuestionOptions";
import { QuestionTranslationPanel } from "@/features/tests/components/QuestionTranslationPanel";
import type { usePracticeSession } from "@/features/tests/hooks/usePracticeSession";
import { useSignedMedia } from "@/features/tests/hooks/useSignedMedia";
import { isPracticeAnswerGraded } from "@/features/tests/lib/practiceAnswers";
import { getPartPracticeConfig } from "@/features/tests/lib/partPracticeConfig";
import type { PracticeItem } from "@/features/tests/lib/practiceGroups";

type OptionKey = "A" | "B" | "C" | "D";

export type PracticeQuestionSession = Pick<
  ReturnType<typeof usePracticeSession>,
  | "getAnswer"
  | "selectAnswer"
  | "isQuestionPending"
  | "isQuestionSyncFailed"
  | "retrySync"
  | "correctCount"
  | "wrongCount"
>;

type PracticeQuestionScreenProps = {
  testId: number;
  partNumber: number;
  item: PracticeItem;
  practice: PracticeQuestionSession;
  accessToken: string | null;
  clearSession: () => void;
  navigation?: React.ReactNode;
  layout?: "split-plain" | "panel";
  practiceMode?: PracticeMode;
  questionPosition?: {
    total: number;
  };
};

export function PracticeQuestionScreen({
  testId,
  partNumber,
  item,
  practice,
  accessToken,
  clearSession,
  navigation,
  layout = "split-plain",
  practiceMode = "practice",
  questionPosition,
}: PracticeQuestionScreenProps) {
  const partConfig = getPartPracticeConfig(partNumber);
  const question = item.question;

  const signedMedia = useSignedMedia({
    testId,
    partNumber,
    group: item.group,
    accessToken,
    clearSession,
  });

  const currentAnswer = practice.getAnswer(question.id);
  const isAnswered = isPracticeAnswerGraded(currentAnswer);

  const handleSelect = (key: OptionKey) => {
    if (isAnswered) {
      return;
    }

    practice.selectAnswer(question.id, key);
  };

  const showContext =
    partConfig.leftPanel !== "listening-group" ||
    !partConfig.hideContextUntilGroupComplete ||
    isAnswered;

  const leftPanel =
    partConfig.leftPanel !== "none" ? (
      <PracticeLeftPanel
        audioUrl={signedMedia.audioUrl}
        group={item.group}
        imageUrl={signedMedia.imageUrl}
        mediaError={signedMedia.mediaError}
        onMediaError={signedMedia.handleMediaError}
        partConfig={partConfig}
        plain={layout === "split-plain"}
        questionNumber={question.questionNumber}
        questionText={question.question}
        showContext={showContext}
        showContextTranslation={isAnswered}
      />
    ) : null;

  const syncFailureBanner = practice.isQuestionSyncFailed(question.id) ? (
    <p className="text-base text-red-600">
      Could not save this answer.{" "}
      <button
        className="underline"
        onClick={() => practice.retrySync(question.id)}
        type="button"
      >
        Retry
      </button>
    </p>
  ) : null;

  const answerPanel = (
    <>
      <QuestionOptions
        answerKey={currentAnswer?.answerKey ?? null}
        isLocked={isAnswered}
        isSubmitting={practice.isQuestionPending(question.id)}
        onSelect={handleSelect}
        optionCount={question.optionCount}
        options={question.options}
        selectedKey={currentAnswer?.selectedKey ?? null}
        showEnglishTextBeforeAnswer={partConfig.showOptionTextBeforeAnswer}
      />
      <QuestionTranslationPanel
        answerKey={currentAnswer?.answerKey ?? null}
        optionCount={question.optionCount}
        options={question.options}
        questionVi={question.questionVi}
        variant={partConfig.translationVariant}
        visible={isAnswered}
      />
      {syncFailureBanner}
    </>
  );

  const promptAndAnswers = (
    <div className="flex flex-col gap-4">
      <PracticeQuestionPrompt
        questionNumber={question.questionNumber}
        questionText={
          partConfig.showQuestionInRightPanel ? question.question : null
        }
      />
      {answerPanel}
    </div>
  );

  if (layout === "split-plain") {
    return (
      <PracticeSplitPlainLayout
        left={leftPanel}
        navigation={navigation}
        right={promptAndAnswers}
      />
    );
  }

  const questionLabel = questionPosition
    ? `Question ${question.questionNumber} / ${questionPosition.total}`
    : `Question ${question.questionNumber}`;

  return (
    <>
      <div>
        <p className="text-base text-muted-foreground">
          Test {testId} · Part {partNumber}
          {practiceMode === "review_wrong" ? " · Review wrong" : ""}
        </p>
        <h1 className="text-xl font-semibold">{questionLabel}</h1>
        <p className="mt-1 text-base text-muted-foreground">
          {practiceMode === "review_wrong"
            ? `Fixed ${practice.correctCount} · ${questionPosition?.total ?? 0} questions`
            : `Correct ${practice.correctCount} · Wrong ${practice.wrongCount}`}
        </p>
      </div>

      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-2">
        {leftPanel}

        <div className="flex min-h-0 flex-col gap-4">
          {partConfig.showQuestionInRightPanel && question.question?.trim() ? (
            <div className="rounded-xl border border-border p-4">
              <h3 className="mb-2 text-base font-semibold">Question</h3>
              <p className="text-base leading-relaxed select-text">
                {question.question}
              </p>
            </div>
          ) : null}

          {answerPanel}
        </div>
      </div>

      {navigation}
    </>
  );
}
