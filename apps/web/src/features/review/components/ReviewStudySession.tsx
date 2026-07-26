"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ReviewCard } from "@/features/review/components/ReviewCard";
import { ReviewGradeButtons } from "@/features/review/components/ReviewGradeButtons";
import type { ReviewMode } from "@/features/review/components/ReviewModeToggle";
import { ReviewTypingCard, type TypingResult } from "@/features/review/components/ReviewTypingCard";
import type { ReviewStudyWord } from "@/features/review/model/reviewStudyWord";
import { useTypingField } from "@/features/review/hooks/useTypingField";
import { compareTypingAnswer } from "@/features/review/lib/typing";

type ReviewStudySessionProps = {
  error?: string | null;
  errorHint?: string;
  isSubmitting: boolean;
  level: number;
  mode: ReviewMode;
  onAgain: () => void;
  onEasy: () => void;
  onGood: () => void;
  onHard: () => void;
  reviewedCount: number;
  totalWords: number;
  word: ReviewStudyWord;
};

export function ReviewStudySession({
  mode,
  word,
  ...props
}: ReviewStudySessionProps) {
  return <ReviewStudySessionContent key={`${mode}-${word.id}`} mode={mode} word={word} {...props} />;
}

function ReviewStudySessionContent({
  error = null,
  errorHint = "Choose a rating again to retry.",
  isSubmitting,
  level,
  onAgain,
  onEasy,
  onGood,
  onHard,
  reviewedCount,
  totalWords,
  mode,
  word,
}: ReviewStudySessionProps) {
  const [showMeaning, setShowMeaning] = useState(false);
  const [typedAnswer, setTypedAnswer] = useState("");
  const [typingResult, setTypingResult] = useState<TypingResult | null>(null);
  const isTypingMode = mode === "typing";
  const {
    typingInputRef,
    typingMeasureRef,
    typingFieldRef,
    typingFieldText,
  } = useTypingField({
    typedAnswer,
    enabled: isTypingMode,
  });

  const handleTypingSubmit = useCallback(() => {
    if (typingResult) return;

    const submittedAnswer = typedAnswer.trim();
    setTypingResult({
      isCorrect: compareTypingAnswer(word.word, submittedAnswer),
      submittedAnswer,
    });
  }, [typedAnswer, typingResult, word.word]);

  const keydownStateRef = useRef({
    handleTypingSubmit,
    isSubmitting,
    isTypingMode,
    showMeaning,
    typingResult,
  });

  useEffect(() => {
    keydownStateRef.current = {
      handleTypingSubmit,
      isSubmitting,
      isTypingMode,
      showMeaning,
      typingResult,
    };
  }, [
    handleTypingSubmit,
    isSubmitting,
    isTypingMode,
    showMeaning,
    typingResult,
  ]);

  useEffect(() => {
    if (isTypingMode && !typingResult) {
      typingInputRef.current?.focus();
    }
  }, [isTypingMode, typingInputRef, typingResult, word.id]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const state = keydownStateRef.current;

      if (state.isSubmitting || event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }

      if (state.isTypingMode) {
        if (event.key === "Enter" && !state.typingResult) {
          event.preventDefault();
          state.handleTypingSubmit();
          return;
        }

        if (!state.typingResult) {
          return;
        }
      } else if (event.code === "Space") {
        event.preventDefault();
        setShowMeaning((current) => !current);
        return;
      } else if (!state.showMeaning) {
        return;
      }

    }

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const canGrade = isTypingMode ? Boolean(typingResult) : showMeaning;

  return (
    <>
      {isTypingMode ? (
        <ReviewTypingCard
          onTypedAnswerChange={setTypedAnswer}
          reviewedCount={reviewedCount}
          totalWords={totalWords}
          typedAnswer={typedAnswer}
          typingFieldRef={typingFieldRef}
          typingFieldText={typingFieldText}
          typingInputRef={typingInputRef}
          typingMeasureRef={typingMeasureRef}
          typingResult={typingResult}
          word={word}
        />
      ) : (
        <ReviewCard
          onToggleMeaning={() => setShowMeaning((current) => !current)}
          reviewedCount={reviewedCount}
          showMeaning={showMeaning}
          totalWords={totalWords}
          word={word}
        />
      )}
      {canGrade ? (
        <ReviewGradeButtons
          disabled={isSubmitting}
          level={level}
          onAgain={onAgain}
          onEasy={onEasy}
          onGood={onGood}
          onHard={onHard}
        />
      ) : null}
      {error ? (
        <p className="text-center text-sm text-danger">
          {error} {errorHint}
        </p>
      ) : null}
    </>
  );
}
