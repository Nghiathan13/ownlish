import type { VocabReviewItem } from "@/entities/vocab/api/vocab";
import { classNames } from "@/shared/lib/classNames";
import {
  primaryTextButtonClassName,
  secondaryTextButtonClassName,
} from "@/shared/ui/button";
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
  const progressLabel = totalWords > 0 ? `${remainingWords} due` : "Review";

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
      <article className="relative overflow-hidden rounded-[2rem] border border-border bg-background p-5 shadow-[0_24px_80px_color-mix(in_srgb,var(--foreground)_10%,transparent)] sm:p-8 lg:min-h-[34rem]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_20%_0%,color-mix(in_srgb,var(--foreground)_12%,transparent),transparent_22rem)]"
        />

        <div className="relative flex min-h-full flex-col gap-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span className="rounded-full border border-border bg-muted px-3 py-1 font-medium text-foreground">
                {progressLabel}
              </span>
              <span>Level {word.level}</span>
              <span aria-hidden>-</span>
              <span>Wrong {word.wrongCount}</span>
            </div>

            <div className="hidden items-center gap-2 text-xs text-muted-foreground sm:flex">
              <ShortcutKey>Space</ShortcutKey>
              <span>reveal</span>
            </div>
          </div>

          <div className="grid flex-1 content-center gap-5 py-4">
            <div>
              <h2 className="break-words text-[clamp(3.5rem,12vw,8rem)] font-black leading-[0.88] tracking-tighter">
                {word.vocabWord.word}
              </h2>
              <div className="mt-5 flex flex-wrap items-center gap-2 text-muted-foreground">
                {ipa ? (
                  <span className="rounded-full border border-border px-3 py-1 font-mono text-sm">
                    {ipa}
                  </span>
                ) : null}
                {word.type ? (
                  <span className="rounded-full border border-border px-3 py-1 text-sm">
                    {word.type}
                  </span>
                ) : null}
                {word.band ? (
                  <span className="rounded-full border border-border px-3 py-1 text-sm">
                    {word.band}
                  </span>
                ) : null}
              </div>
            </div>

            <section
              className={classNames(
                "min-h-36 rounded-3xl border p-5 sm:p-6",
                showMeaning
                  ? "border-foreground/20 bg-surface"
                  : "border-dashed border-border bg-muted/60",
              )}
            >
              {showMeaning ? (
                <ReviewMeaning word={word} />
              ) : (
                <div className="grid h-full content-center gap-2 text-muted-foreground">
                  <p className="text-lg font-semibold text-foreground">
                    Hold the answer in your head first.
                  </p>
                  <p className="max-w-xl leading-7">
                    Reveal only after you can say the Vietnamese meaning or a clear English definition.
                  </p>
                </div>
              )}
            </section>
          </div>

          <div className="grid gap-3 md:grid-cols-[1fr_0.9fr_0.9fr]">
            <button
              type="button"
              className={secondaryTextButtonClassName("w-full py-3")}
              onClick={onToggleMeaning}
            >
              {showMeaning ? "Hide meaning" : "Reveal meaning"}
            </button>
            <button
              type="button"
              className={secondaryTextButtonClassName(
                "w-full py-3 text-danger hover:border-danger",
              )}
              disabled={!canGrade}
              onClick={() => onGrade("forgot")}
              title={showMeaning ? "Forgot" : "Show meaning before grading"}
            >
              Forgot
            </button>
            <button
              type="button"
              className={primaryTextButtonClassName("w-full py-3")}
              disabled={!canGrade}
              onClick={() => onGrade("remember")}
              title={showMeaning ? "Remember" : "Show meaning before grading"}
            >
              Remember
            </button>
          </div>
        </div>
      </article>

      <aside className="grid gap-4 lg:content-start">
        <div className="rounded-[1.5rem] border border-border bg-background/80 p-5">
          <p className="text-sm font-semibold text-muted-foreground">Session</p>
          <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-1">
            <Metric label="Due now" value={remainingWords} />
            <Metric label="Loaded" value={totalWords} />
          </div>
        </div>

        <div className="rounded-[1.5rem] border border-border bg-muted/50 p-5">
          <p className="text-sm font-semibold text-muted-foreground">Keys</p>
          <dl className="mt-4 grid gap-3 text-sm">
            <ShortcutRow command="Space" label="Reveal or hide" />
            <ShortcutRow command="1" label="Forgot" />
            <ShortcutRow command="2" label="Remember" />
          </dl>
        </div>

        {word.nextReview ? (
          <div className="rounded-[1.5rem] border border-border bg-background/80 p-5 text-sm text-muted-foreground">
            <p className="font-semibold text-foreground">Scheduled</p>
            <p className="mt-2">This card was due before this review session.</p>
          </div>
        ) : null}
      </aside>
    </div>
  );
}

function ReviewMeaning({ word }: { word: VocabReviewItem }) {
  return (
    <div className="grid gap-4">
      <div>
        <p className="text-sm font-semibold text-muted-foreground">Meaning</p>
        <p className="mt-2 text-2xl font-bold leading-tight">
          {word.meaningVi || word.definition || "No meaning added."}
        </p>
      </div>

      {word.definition && word.meaningVi ? (
        <div>
          <p className="text-sm font-semibold text-muted-foreground">Definition</p>
          <p className="mt-1 leading-7">{word.definition}</p>
        </div>
      ) : null}

      {word.example ? (
        <blockquote className="border-l-2 border-border pl-4">
          <p className="leading-7 text-foreground">{word.example}</p>
          {word.exampleVi ? (
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {word.exampleVi}
            </p>
          ) : null}
        </blockquote>
      ) : null}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-muted p-4">
      <p className="text-xs font-semibold text-muted-foreground">{label}</p>
      <p className="mt-2 font-mono text-3xl font-bold leading-none">{value}</p>
    </div>
  );
}

function ShortcutKey({ children }: { children: string }) {
  return (
    <kbd className="rounded-md border border-border bg-background px-2 py-1 font-mono text-[11px] font-semibold text-foreground shadow-sm">
      {children}
    </kbd>
  );
}

function ShortcutRow({ command, label }: { command: string; label: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt>
        <ShortcutKey>{command}</ShortcutKey>
      </dt>
      <dd className="text-muted-foreground">{label}</dd>
    </div>
  );
}
