type PracticeQuestionPromptProps = {
  questionNumber: number;
  questionText?: string | null;
};

export function PracticeQuestionPrompt({
  questionNumber,
  questionText,
}: PracticeQuestionPromptProps) {
  const text = questionText?.trim();

  return (
    <p className="text-base font-bold leading-relaxed select-text">
      <span className="tabular-nums">{questionNumber}.</span>
      {text ? ` ${text}` : null}
    </p>
  );
}
