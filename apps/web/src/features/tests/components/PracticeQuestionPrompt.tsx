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
    <p className="text-base leading-relaxed select-text">
      <span className="font-bold tabular-nums">{questionNumber}.</span>
      {text ? ` ${text}` : null}
    </p>
  );
}
