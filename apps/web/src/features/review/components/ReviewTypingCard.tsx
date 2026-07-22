"use client";

import type { CSSProperties, RefObject } from "react";
import type { VocabReviewItem } from "@/entities/vocab/api/vocab";
import { getTypingAnswer } from "@/features/review/lib/typing";
import { VolumeIcon } from "@/shared/ui/icons/VolumeIcon";
import { classNames } from "@/shared/lib/classNames";
import { statusColorClasses } from "@/shared/ui/theme/statusColors";

export type TypingResult = {
  isCorrect: boolean;
  submittedAnswer: string;
};

type ReviewTypingCardProps = {
  canSpeak: boolean;
  onPronounce: () => void;
  onTypedAnswerChange: (value: string) => void;
  typedAnswer: string;
  typingFieldStyle: CSSProperties;
  typingFieldText: string;
  typingInputRef: RefObject<HTMLInputElement | null>;
  typingMeasureRef: RefObject<HTMLSpanElement | null>;
  typingResult: TypingResult | null;
  word: VocabReviewItem;
};

export function ReviewTypingCard({
  canSpeak,
  onPronounce,
  onTypedAnswerChange,
  typedAnswer,
  typingFieldStyle,
  typingFieldText,
  typingInputRef,
  typingMeasureRef,
  typingResult,
  word,
}: ReviewTypingCardProps) {
  return (
    <article className="rounded-[1.75rem] bg-surface p-5 shadow-card sm:p-8 dark:border dark:border-border">
      <div className="grid min-h-[18rem] content-center gap-6 text-center sm:min-h-[22rem]">
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            aria-label={canSpeak ? "Pronunciation" : "Pronunciation unavailable"}
            className={classNames(
              "inline-flex size-11 items-center justify-center rounded-full text-muted-foreground transition-colors",
              canSpeak
                ? "hover:bg-hover-overlay hover:text-foreground"
                : "cursor-not-allowed opacity-30",
            )}
            disabled={!canSpeak}
            onClick={canSpeak ? onPronounce : undefined}
            type="button"
          >
            <VolumeIcon className="size-6" />
          </button>
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

        <div
          className="relative mx-auto w-[min(var(--typing-field-width),388px,calc(100vw-6rem))] transition-[width] duration-300"
          style={typingFieldStyle}
        >
          <span
            aria-hidden
            className="invisible absolute whitespace-pre text-xl leading-none"
            ref={typingMeasureRef}
          >
            {typingFieldText}
          </span>
          <input
            autoComplete="off"
            className="mx-auto block h-10 w-[calc(100%-28px)] max-w-[360px] border-0 bg-transparent px-0 py-2 text-center text-xl text-foreground outline-none placeholder:text-muted-foreground/50 read-only:text-muted-foreground"
            onChange={(event) => onTypedAnswerChange(event.target.value)}
            placeholder="Type the word"
            readOnly={Boolean(typingResult)}
            ref={typingInputRef}
            spellCheck={false}
            value={typedAnswer}
          />
          <span
            aria-hidden
            className={classNames(
              "pointer-events-none absolute inset-x-0 bottom-0 h-px rounded-full transition-colors",
              typedAnswer ? "bg-foreground" : "bg-muted",
            )}
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
