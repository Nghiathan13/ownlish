"use client";

import type { ComponentType, SVGProps } from "react";
import { useState } from "react";
import {
  LANDING_VOCAB_DEMO_METRICS,
  LANDING_VOCAB_DEMO_WORD,
} from "@/features/home/lib/landingDemoData";
import { iconTextButtonClassName } from "@/shared/ui/button";
import { ProgressNavIcon } from "@/shared/ui/icons/ProgressNavIcon";
import { ReviewNavIcon } from "@/shared/ui/icons/ReviewNavIcon";

const vocabCardClassName =
  "flex flex-col rounded-2xl bg-surface p-5 shadow-card dark:border dark:border-border sm:p-6";

export function LandingVocabSection() {
  return (
    <section
      className="flex flex-col gap-8 px-4 py-16 sm:px-16 lg:py-24"
      id="vocabulary"
    >
      <div className="flex flex-col items-center gap-3 text-center">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Build vocabulary that sticks.
        </h2>
        <p className="max-w-xl text-lg text-muted-foreground">
          Bilingual cards and spaced review in one place.
        </p>
      </div>
      <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
        <LandingReviewCard />
        <LandingProgressCard />
      </div>
    </section>
  );
}

function VocabCardHeader({
  Icon,
  title,
  description,
}: {
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="inline-flex shrink-0 items-center justify-center rounded-lg border border-border p-1.5 text-foreground">
        <Icon className="size-8" />
      </span>
      <div className="min-w-0">
        <h3 className="text-base font-semibold leading-tight">{title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

function LandingReviewCard() {
  const [showMeaning, setShowMeaning] = useState(false);
  const [reviewedCount, setReviewedCount] = useState(0);
  const [graded, setGraded] = useState<"forgot" | "remember" | null>(null);
  const word = LANDING_VOCAB_DEMO_WORD;
  const totalWords = 1;
  const progressPercent = totalWords > 0 ? (reviewedCount / totalWords) * 100 : 0;
  const canGrade = showMeaning && !graded;

  function reset() {
    setShowMeaning(false);
    setReviewedCount(0);
    setGraded(null);
  }

  function handleGrade(grade: "forgot" | "remember") {
    if (!canGrade) {
      return;
    }

    setGraded(grade);
    setReviewedCount(1);
  }

  return (
    <article className={vocabCardClassName}>
      <VocabCardHeader
        Icon={ReviewNavIcon}
        description="Reveal, then grade Forgot or Remember."
        title="Review"
      />

      <div className="mt-5 flex flex-1 flex-col gap-3">
        <div
          aria-label={showMeaning ? "Hide meaning" : "Reveal meaning"}
          className="flex flex-1 cursor-pointer flex-col"
          onClick={() => setShowMeaning((current) => !current)}
        >
          <div className="mb-6 grid gap-2">
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

          <div className="grid min-h-[16rem] flex-1 content-center gap-6 text-center">
            <div>
              <div className="flex flex-wrap items-start justify-center gap-2">
                <p className="break-words text-[32px] font-black sm:text-[40px]">
                  {word.word}
                  <span className="ml-2 font-medium text-muted-foreground text-[16px] sm:text-[18px]">
                    ({word.type})
                  </span>
                </p>
                <span className="rounded-full border border-border bg-muted px-1.5 py-0.5 font-semibold text-muted-foreground text-[10px]">
                  {word.band}
                </span>
              </div>
              <p className="text-muted-foreground text-[16px] sm:text-[18px]">
                /{word.ipaUk}/
              </p>
            </div>

            {showMeaning ? (
              <div className="mx-auto grid w-full max-w-xl gap-4 text-center">
                <p className="text-2xl font-bold leading-tight">
                  {word.meaningVi}
                </p>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    Definition
                  </p>
                  <p className="mt-2 leading-7">{word.definition}</p>
                </div>
                <div className="mx-auto w-full text-center">
                  <p className="leading-7 text-foreground">{word.example}</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {word.exampleVi}
                  </p>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
          {graded ? (
            <>
              <span className="font-medium text-foreground">
                {graded === "remember"
                  ? "Nice — scheduled for later review."
                  : "Noted — this word will come back sooner."}
              </span>
              <button
                className={iconTextButtonClassName(
                  "border-border bg-transparent text-sm text-foreground hover:bg-hover-overlay",
                )}
                onClick={reset}
                type="button"
              >
                Try again
              </button>
            </>
          ) : !showMeaning ? (
            <span className="inline-flex items-center gap-1">
              <Kbd>Space</Kbd>
              <span>Reveal</span>
            </span>
          ) : (
            <>
              <span className="inline-flex items-center gap-1">
                <Kbd>Space</Kbd>
                <span>Hide</span>
              </span>
              <button
                className="inline-flex items-center gap-1 text-muted-foreground"
                onClick={() => handleGrade("forgot")}
                type="button"
              >
                <Kbd>1</Kbd>
                <span>Forgot</span>
              </button>
              <button
                className="inline-flex items-center gap-1 font-semibold text-foreground"
                onClick={() => handleGrade("remember")}
                type="button"
              >
                <Kbd>2</Kbd>
                <span>Remember</span>
              </button>
            </>
          )}
        </div>
      </div>
    </article>
  );
}

function LandingProgressCard() {
  const metrics = [
    { label: "Due for review", value: LANDING_VOCAB_DEMO_METRICS.due },
    { label: "Mastered", value: LANDING_VOCAB_DEMO_METRICS.mastered },
    { label: "Difficult", value: LANDING_VOCAB_DEMO_METRICS.difficult },
  ];

  return (
    <article className={vocabCardClassName}>
      <VocabCardHeader
        Icon={ProgressNavIcon}
        description="Due, mastered, and difficult words."
        title="Progress"
      />
      <div className="mt-5 grid flex-1 grid-cols-1 gap-3">
        {metrics.map((metric) => (
          <div
            className="rounded-xl border border-border bg-background p-4"
            key={metric.label}
          >
            <p className="text-sm text-muted-foreground">{metric.label}</p>
            <p className="mt-2 font-mono text-3xl font-semibold tracking-tight tabular-nums">
              {metric.value}
            </p>
          </div>
        ))}
      </div>
    </article>
  );
}

function Kbd({ children }: { children: string }) {
  return (
    <kbd className="rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[11px] font-semibold text-foreground">
      {children}
    </kbd>
  );
}
