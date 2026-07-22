"use client";

import type { RefObject } from "react";
import type { VocabReviewItem } from "@/entities/vocab/api/vocab";
import {
  ReviewModeToggle,
  type ReviewMode,
} from "@/features/review/components/ReviewModeToggle";
import { ReviewProgress } from "@/features/review/components/ReviewProgress";
import { getTypingAnswer } from "@/features/review/lib/typing";
import { classNames } from "@/shared/lib/classNames";
import { statusColorClasses } from "@/shared/ui/theme/statusColors";

export type TypingResult = {
  isCorrect: boolean;
  submittedAnswer: string;
};

type ReviewTypingCardProps = {
  mode: ReviewMode;
  onModeChange: (mode: ReviewMode) => void;
  onTypedAnswerChange: (value: string) => void;
  reviewedCount: number;
  totalWords: number;
  typedAnswer: string;
  typingFieldRef: RefObject<HTMLDivElement | null>;
  typingFieldText: string;
  typingInputRef: RefObject<HTMLInputElement | null>;
  typingMeasureRef: RefObject<HTMLSpanElement | null>;
  typingResult: TypingResult | null;
  word: VocabReviewItem;
};

export function ReviewTypingCard({
  mode,
  onModeChange,
  onTypedAnswerChange,
  reviewedCount,
  totalWords,
  typedAnswer,
  typingFieldRef,
  typingFieldText,
  typingInputRef,
  typingMeasureRef,
  typingResult,
  word,
}: ReviewTypingCardProps) {
  return (
    <article className="rounded-[1.75rem] bg-surface p-5 shadow-card sm:p-8 dark:border dark:border-border">
      <div className="mb-8 grid gap-3">
        <ReviewModeToggle mode={mode} onModeChange={onModeChange} />
        <ReviewProgress reviewedCount={reviewedCount} totalWords={totalWords} />
      </div>

      <div className="grid min-h-[18rem] content-center gap-6 text-center sm:min-h-[22rem]">
        {(word.type || word.band) ? (
          <div className="flex flex-wrap items-center justify-center gap-2">
            {word.type ? (
              <span className="font-medium text-muted-foreground text-[16px] sm:text-[18px]">
                ({word.type})
              </span>
            ) : null}
            {word.band ? (
              <span className="rounded-full border border-border bg-muted px-1.5 py-0.5 font-semibold text-muted-foreground text-[10px]">
                {word.band}
              </span>
            ) : null}
          </div>
        ) : null}

        <div
          className={classNames(
            "relative mx-auto w-[156px] max-w-[min(388px,calc(100vw-6rem))]",
            "transition-[width] duration-[320ms] ease-[cubic-bezier(0.2,0.8,0.2,1)]",
            "after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:h-px after:rounded-full",
            "after:transition-[background-color] after:duration-[220ms] after:ease-out",
            typedAnswer ? "after:bg-foreground" : "after:bg-muted",
          )}
          ref={typingFieldRef}
        >
          <span
            aria-hidden
            className="invisible absolute whitespace-pre font-[inherit] text-[20px] leading-none"
            ref={typingMeasureRef}
          >
            {typingFieldText}
          </span>
          <input
            autoComplete="off"
            className="mx-auto block h-[38px] w-[calc(100%-28px)] max-w-[360px] border-0 bg-transparent px-0 py-2 text-center font-[inherit] text-[20px] leading-none text-foreground outline-none placeholder:text-muted-foreground/50 read-only:text-muted-foreground"
            onChange={(event) => onTypedAnswerChange(event.target.value)}
            placeholder="Type the word"
            readOnly={Boolean(typingResult)}
            ref={typingInputRef}
            spellCheck={false}
            value={typedAnswer}
          />
        </div>

        <div className="min-h-24 text-[15px] text-muted-foreground">
          {typingResult ? (
            <>
              <p
                className={classNames(
                  "mb-3.5 text-lg font-semibold",
                  typingResult.isCorrect
                    ? statusColorClasses.success.text
                    : statusColorClasses.danger.text,
                )}
              >
                {typingResult.isCorrect ? "Correct" : "Incorrect"}
              </p>
              <p className="flex items-center justify-center gap-2.5">
                <span className="text-muted-foreground/70">Answer</span>
                <strong className="font-medium text-foreground">
                  {getTypingAnswer(word.vocabWord.word)}
                </strong>
              </p>
              {!typingResult.isCorrect ? (
                <p className="mt-1.5 flex items-center justify-center gap-2.5">
                  <span className="text-muted-foreground/70">You typed</span>
                  <strong className="font-medium text-muted-foreground">
                    {typingResult.submittedAnswer || "-"}
                  </strong>
                </p>
              ) : null}
            </>
          ) : null}
        </div>
      </div>
    </article>
  );
}
