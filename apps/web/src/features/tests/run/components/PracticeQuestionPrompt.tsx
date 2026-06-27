import { BilingualTranslationText } from "@/features/tests/run/components/BilingualTranslationText";

type PracticeQuestionPromptProps = {
  questionNumber: number;
  questionText?: string | null;
  questionVi?: string | null;
  plainTranslation?: boolean;
  showBilingual?: boolean;
};

export function PracticeQuestionPrompt({
  questionNumber,
  questionText,
  questionVi,
  plainTranslation = false,
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
        <BilingualTranslationText plain={plainTranslation} variant="question">
          {viText}
        </BilingualTranslationText>
      ) : null}
    </div>
  );
}
