"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { ToeicQuestionOptions } from "@/entities/toeic/api/types";
import {
  LANDING_PART3_DEMO,
  type LandingOptionKey,
} from "@/features/home/lib/landingDemoData";
import { QuestionOptions } from "@/features/tests/run/components/QuestionOptions";
import {
  iconTextButtonClassName,
  secondaryTextButtonClassName,
} from "@/shared/ui/button";

type Selections = Record<string, LandingOptionKey | null>;

function createEmptySelections(): Selections {
  return Object.fromEntries(
    LANDING_PART3_DEMO.questions.map((question) => [question.id, null]),
  ) as Selections;
}

function toToeicOptions(
  options: Record<LandingOptionKey, string>,
): ToeicQuestionOptions {
  return {
    A: options.A,
    B: options.B,
    C: options.C,
    D: options.D,
    A_vi: null,
    B_vi: null,
    C_vi: null,
    D_vi: null,
  };
}

function isComplete(selections: Selections) {
  return LANDING_PART3_DEMO.questions.every(
    (question) => selections[question.id] != null,
  );
}

export function LandingPart3Demo() {
  const demo = LANDING_PART3_DEMO;
  const [selections, setSelections] = useState<Selections>(createEmptySelections);
  const [revealed, setRevealed] = useState(false);

  const correctCount = revealed
    ? demo.questions.filter(
        (question) => selections[question.id] === question.answerKey,
      ).length
    : 0;

  function handleSelect(questionId: string, key: LandingOptionKey) {
    if (revealed) {
      return;
    }

    const nextSelections = { ...selections, [questionId]: key };
    setSelections(nextSelections);
    if (isComplete(nextSelections)) {
      setRevealed(true);
    }
  }

  function handleReset() {
    setSelections(createEmptySelections());
    setRevealed(false);
  }

  return (
    <section
      className="flex flex-col gap-8 px-8 py-16 sm:px-16 lg:py-24"
      id="toeic"
    >
      <div className="flex flex-col items-center gap-3 text-center">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Try a real Part 3 conversation.
        </h2>
        <p className="max-w-xl text-lg text-muted-foreground">
          One short dialogue, three questions — same flow as in the app.
        </p>
      </div>

      <div className="mx-auto grid w-full max-w-6xl gap-6 rounded-2xl bg-surface p-5 shadow-card lg:grid-cols-2 lg:gap-8 lg:p-8">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-border bg-muted px-3 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {demo.label}
            </span>
            <span className="text-sm text-muted-foreground">{demo.source}</span>
          </div>

          <audio
            className="w-full"
            controls
            preload="metadata"
            src={demo.audioSrc}
          >
            Your browser does not support the audio element.
          </audio>

          <div className="overflow-hidden rounded-xl border border-border bg-background">
            <Image
              alt="Part 3 graphic for questions 68 to 70"
              className="h-auto w-full"
              height={720}
              src={demo.imageSrc}
              width={960}
            />
          </div>

          {revealed ? (
            <div className="grid gap-4">
              <div className="rounded-xl border border-border bg-background p-4">
                <p className="text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Transcript
                </p>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-6">
                  {demo.transcriptEn}
                </p>
              </div>
              <div className="rounded-xl border border-border bg-background p-4">
                <p className="text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Translation
                </p>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                  {demo.transcriptVi}
                </p>
              </div>
            </div>
          ) : null}
        </div>

        <div className="flex flex-col gap-5">
          {demo.questions.map((question) => (
            <div className="grid gap-3" key={question.id}>
              <p className="text-base font-medium leading-snug">
                <span className="mr-2">{question.number}.</span>
                {question.prompt}
              </p>
              <QuestionOptions
                answerKey={question.answerKey}
                isLocked={revealed}
                onSelect={(key) => handleSelect(question.id, key)}
                optionCount={4}
                options={toToeicOptions(question.options)}
                selectedKey={selections[question.id]}
                showEnglishTextBeforeAnswer
                showResult={revealed}
              />
            </div>
          ))}

          {revealed ? (
            <div className="mt-auto flex flex-wrap items-center gap-3 pt-2">
              <p className="text-sm font-medium">
                {correctCount}/{demo.questions.length} correct
              </p>
              <button
                className={secondaryTextButtonClassName()}
                onClick={handleReset}
                type="button"
              >
                Try again
              </button>
              <Link
                className={iconTextButtonClassName(
                  "border-foreground bg-foreground text-background hover:[box-shadow:inset_0_0_0_9999px_var(--hover-overlay-solid)]",
                )}
                href="/login"
              >
                Get started
              </Link>
            </div>
          ) : null}
        </div>
      </div>

      <p className="text-center text-sm text-muted-foreground">
        Listening 1–4 · Reading 5–7 · Mock + Practice · 80+ exams (2019–2026,
        ETS &amp; YBM)
      </p>
    </section>
  );
}
