import { BilingualTranslationText } from "@/features/tests/run/components/BilingualTranslationText";

type PracticeQuestionPromptProps = {
  questionNumber: number;
  questionText?: string | null;
  questionVi?: string | null;
  showBilingual?: boolean;
};

export function PracticeQuestionPrompt({
  questionNumber,
  questionText,
  questionVi,
  showBilingual = false,
}: PracticeQuestionPromptProps) {
  const text = questionText?.trim();
  const viText = questionVi?.trim();

  return (
    <div className="flex flex-col gap-1">
      <p className="text-base font-bold select-text">
        <span className="tabular-nums">{questionNumber}.</span>
        {text ? ` ${text}` : null}
      </p>
      {showBilingual && viText ? (
        <BilingualTranslationText variant="question">{viText}</BilingualTranslationText>
      ) : null}
    </div>
  );
}
