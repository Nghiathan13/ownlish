import type { VocabReviewItem } from "@/entities/vocab/api/vocab";
import type { ReviewGrade } from "../lib/reviewSchedule";

type ReviewCardProps = {
  isSubmitting: boolean;
  onGrade: (grade: ReviewGrade) => void;
  onToggleMeaning: () => void;
  remainingWords: number;
  showMeaning: boolean;
  totalWords: number;
  word: VocabReviewItem;
};

export function ReviewCard({
  isSubmitting,
  onGrade,
  onToggleMeaning,
  remainingWords,
  showMeaning,
  totalWords,
  word,
}: ReviewCardProps) {
  const canGrade = showMeaning && !isSubmitting;
  const ipa = word.ipaUk ?? word.ipaUs;
  const completedCount = Math.max(totalWords - remainingWords, 0);
  const progressPercent = totalWords > 0 ? (completedCount / totalWords) * 100 : 0;

  return (
    <div className="mx-auto grid w-full max-w-3xl gap-3">
      <article className="rounded-[1.75rem] bg-surface p-5 shadow-card sm:p-8">
        <div className="mb-8 grid gap-2">
          <p className="text-center text-sm text-muted-foreground">
            {completedCount}/{totalWords || remainingWords}
          </p>
          <div
            aria-label={`${completedCount} of ${totalWords} reviewed`}
            aria-valuemax={totalWords}
            aria-valuemin={0}
            aria-valuenow={completedCount}
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
            <div className="flex flex-wrap items-start justify-center gap-x-3 gap-y-2">
              <h2 className="break-words text-[40px] font-black sm:text-[48px] xl:text-[56px]">
                {word.vocabWord.word}
                {word.type ? (
                  <span className="ml-2 font-medium text-muted-foreground text-[16px] sm:text-[18px] xl:text-[20px]">
                    ({word.type})
                  </span>
                ) : null}
              </h2>
              {word.band ? (
                <span className="rounded-full border border-border bg-muted px-2 py-1 font-semibold text-muted-foreground text-[8px] sm:text-[10px] xl:text-[12px]">
                  {word.band}
                </span>
              ) : null}
            </div>

            {ipa ? (
              <p className="mt-2 font-mono text-muted-foreground text-[16px] sm:text-[18px] xl:text-[20px]">
                /{ipa.replace(/^\/+|\/+$/g, "")}/
              </p>
            ) : null}
          </div>

          {showMeaning ? (
            <ReviewMeaning word={word} />
          ) : (
            <button
              className="mx-auto min-h-24 w-full max-w-xl rounded-2xl border border-dashed border-border bg-muted/40 px-4 py-6 text-center text-sm font-medium text-muted-foreground"
              onClick={onToggleMeaning}
              type="button"
            >
              Press Space or click to reveal
            </button>
          )}
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
    <section className="mx-auto grid w-full max-w-xl gap-4 rounded-2xl border border-border bg-surface p-5 text-left">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Meaning
        </p>
        <p className="mt-2 text-2xl font-bold leading-tight">
          {word.meaningVi || word.definition || "No meaning added."}
        </p>
      </div>

      {word.definition && word.meaningVi ? (
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Definition
          </p>
          <p className="mt-2 leading-7">{word.definition}</p>
        </div>
      ) : null}

      {word.example ? (
        <div className="border-t border-border pt-4">
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
