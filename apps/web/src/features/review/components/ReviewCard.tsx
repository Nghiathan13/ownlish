import type { VocabReviewItem } from "@/entities/vocab/api/vocab";
import type { ReviewGrade } from "../lib/reviewSchedule";

type ReviewCardProps = {
  isSubmitting: boolean;
  onGrade: (grade: ReviewGrade) => void;
  onToggleMeaning: () => void;
  reviewedCount: number;
  showMeaning: boolean;
  totalWords: number;
  word: VocabReviewItem;
};

export function ReviewCard({
  isSubmitting,
  onGrade,
  onToggleMeaning,
  reviewedCount,
  showMeaning,
  totalWords,
  word,
}: ReviewCardProps) {
  const canGrade = showMeaning && !isSubmitting;
  const ipa = word.ipaUk ?? word.ipaUs;
  const progressPercent = totalWords > 0 ? (reviewedCount / totalWords) * 100 : 0;

  return (
    <div className="mx-auto grid w-full max-w-3xl gap-3">
      <article
        aria-label={
          showMeaning ? "Hide meaning" : "Reveal meaning"
        }
        className="cursor-pointer rounded-[1.75rem] bg-surface p-5 shadow-card sm:p-8"
        onClick={onToggleMeaning}
      >
        <div className="mb-8 grid gap-2">
          <p className="text-center text-sm text-muted-foreground">
            {reviewedCount}/{totalWords}
          </p>
          <div
            aria-label={`${reviewedCount} of ${totalWords} reviewed`}
            aria-valuemax={totalWords}
            aria-valuemin={0}
            aria-valuenow={reviewedCount}
            className="h-1.5 overflow-hidden rounded-full bg-muted"
            role="progressbar"
          >
            <div
              className="h-full rounded-full bg-foreground"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        <div className="grid min-h-[18rem] content-center gap-6 text-center sm:min-h-[22rem]">
          <div>
            <div className="flex flex-wrap items-start justify-center gap-2">
              <h2 className="break-words text-[40px] font-black sm:text-[52px]">
                {word.vocabWord.word}
                {word.type ? (
                  <span className="ml-2 font-medium text-muted-foreground text-[16px] sm:text-[18px]">
                    ({word.type})
                  </span>
                ) : null}
              </h2>
              {word.band ? (
                <span className="rounded-full border border-border bg-muted px-3 py-1 font-semibold text-muted-foreground text-[12px]">
                  {word.band}
                </span>
              ) : null}
            </div>

            {ipa ? (
              <p className="mt-2 font-mono text-muted-foreground text-[16px] sm:text-[18px]">
                /{ipa.replace(/^\/+|\/+$/g, "")}/
              </p>
            ) : null}
          </div>

          {showMeaning ? <ReviewMeaning word={word} /> : null}
        </div>
      </article>

      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
        {!showMeaning ? (
          <Shortcut command="Space" label="Reveal" />
        ) : (
          <>
            <Shortcut command="Space" label="Hide" />
            <button
              className="inline-flex items-center gap-1 text-muted-foreground disabled:opacity-50"
              disabled={!canGrade}
              onClick={() => onGrade("forgot")}
              type="button"
            >
              <Key>1</Key>
              <span>Forgot</span>
            </button>
            <button
              className="inline-flex items-center gap-1 font-semibold text-foreground disabled:opacity-50"
              disabled={!canGrade}
              onClick={() => onGrade("remember")}
              type="button"
            >
              <Key>2</Key>
              <span>Remember</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function ReviewMeaning({ word }: { word: VocabReviewItem }) {
  return (
    <section className="mx-auto grid w-full max-w-xl gap-4 text-center">
      <p className="text-2xl font-bold leading-tight">
        {word.meaningVi || word.definition || "No meaning added."}
      </p>

      {word.definition && word.meaningVi ? (
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Definition
          </p>
          <p className="mt-2 leading-7">{word.definition}</p>
        </div>
      ) : null}

      {word.example ? (
        <div className="mx-auto w-full text-center">
          <p className="leading-7 text-foreground">{word.example}</p>
          {word.exampleVi ? (
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {word.exampleVi}
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

function Shortcut({ command, label }: { command: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <Key>{command}</Key>
      <span>{label}</span>
    </span>
  );
}

function Key({ children }: { children: string }) {
  return (
    <kbd className="rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[11px] font-semibold text-foreground">
      {children}
    </kbd>
  );
}
