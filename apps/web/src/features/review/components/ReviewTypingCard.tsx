"use client";

import type { RefObject } from "react";
import { ReviewProgress } from "@/features/review/components/ReviewProgress";
import { ReviewMasterButton } from "@/features/review/components/ReviewMasterButton";
import type { ReviewStudyWord } from "@/features/review/model/reviewStudyWord";
import { getTypingAnswer } from "@/features/review/lib/typing";
import { classNames } from "@/shared/lib/classNames";
import { useT } from "@/shared/providers/LocaleProvider";
import { statusColorClasses } from "@/shared/ui/theme/statusColors";

export type TypingResult = {
  isCorrect: boolean;
  submittedAnswer: string;
};

type ReviewTypingCardProps = {
  disabled: boolean;
  onMaster: () => void;
  onTypedAnswerChange: (value: string) => void;
  reviewedCount: number;
  totalWords: number;
  typedAnswer: string;
  typingFieldRef: RefObject<HTMLDivElement | null>;
  typingFieldText: string;
  typingInputRef: RefObject<HTMLInputElement | null>;
  typingMeasureRef: RefObject<HTMLSpanElement | null>;
  typingResult: TypingResult | null;
  word: ReviewStudyWord;
};

export function ReviewTypingCard({
  disabled,
  onMaster,
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
  const t = useT();
  const meaningVi = word.definitions
    .map((definition) => definition.meaningVi?.trim())
    .filter((meaning): meaning is string => Boolean(meaning))
    .join(" · ");

  return (
    <article className="flex h-[480px] flex-col rounded-lg border border-border bg-surface p-5 sm:p-8 dark:bg-[#000000]">
      <div className="mb-8 shrink-0">
        <ReviewProgress reviewedCount={reviewedCount} totalWords={totalWords} />
        <div className="mt-1 flex justify-end">
          <ReviewMasterButton disabled={disabled} onMaster={onMaster} />
        </div>
      </div>

      <div className="grid min-h-0 flex-1 content-center gap-6 overflow-y-auto text-center">
        <div className="grid gap-2">
          {(word.types.length > 0 || word.band) ? (
            <div className="flex flex-wrap items-center justify-center gap-2">
              {word.types.length > 0 ? (
                <span className="font-medium text-muted-foreground text-[16px] sm:text-[18px]">
                  ({word.types.join(" · ")})
                </span>
              ) : null}
              {word.band ? (
                <span className="rounded-full border border-border bg-muted px-1.5 py-0.5 font-semibold text-muted-foreground text-[10px]">
                  {word.band}
                </span>
              ) : null}
            </div>
          ) : null}
          {meaningVi ? (
            <p className="text-2xl font-bold leading-tight text-foreground">
              {meaningVi}
            </p>
          ) : null}
        </div>

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
            placeholder={t("review.typeTheWord")}
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
                {typingResult.isCorrect
                  ? t("review.correct")
                  : t("review.incorrect")}
              </p>
              <p className="flex items-center justify-center gap-2.5">
                <span className="text-muted-foreground/70">{t("review.answer")}</span>
                <strong className="font-medium text-foreground">
                  {getTypingAnswer(word.word)}
                </strong>
              </p>
              {!typingResult.isCorrect ? (
                <p className="mt-1.5 flex items-center justify-center gap-2.5">
                  <span className="text-muted-foreground/70">
                    {t("review.youTyped")}
                  </span>
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
