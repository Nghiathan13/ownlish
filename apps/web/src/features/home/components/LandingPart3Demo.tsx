"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import type { ToeicQuestionOptions } from "@/entities/toeic/api/types";
import { joinContentEvidenceSegments } from "@/entities/toeic-runtime/model/transcriptEvidenceSegments";
import {
  LANDING_PART3_DEMO,
  type LandingOptionKey,
  type LandingPart3Question,
} from "@/features/home/lib/landingDemoData";
import { PassagePanel } from "@/features/tests/run/components/PassagePanel";
import { QuestionOptions } from "@/features/tests/run/components/QuestionOptions";
import { QuestionTranslationPanel } from "@/features/tests/run/components/QuestionTranslationPanel";
import {
  iconTextButtonClassName,
} from "@/shared/ui/button";
import { useT } from "@/shared/providers/LocaleProvider";

type Selections = Record<string, LandingOptionKey | null>;

function createEmptySelections(): Selections {
  return Object.fromEntries(
    LANDING_PART3_DEMO.questions.map((question) => [question.id, null]),
  ) as Selections;
}

function toToeicOptions(question: LandingPart3Question): ToeicQuestionOptions {
  return {
    A: question.options.A,
    B: question.options.B,
    C: question.options.C,
    D: question.options.D,
    A_vi: question.optionsVi.A,
    B_vi: question.optionsVi.B,
    C_vi: question.optionsVi.C,
    D_vi: question.optionsVi.D,
  };
}

function isComplete(selections: Selections) {
  return LANDING_PART3_DEMO.questions.every(
    (question) => selections[question.id] != null,
  );
}

export function LandingPart3Demo() {
  const t = useT();
  const demo = LANDING_PART3_DEMO;
  const sectionRef = useRef<HTMLElement>(null);
  const [selections, setSelections] = useState<Selections>(createEmptySelections);
  const [revealed, setRevealed] = useState(false);

  const transcriptEn = useMemo(
    () => joinContentEvidenceSegments([...demo.transcriptSegments]),
    [demo.transcriptSegments],
  );
  const transcriptVi = useMemo(
    () => joinContentEvidenceSegments([...demo.transcriptViSegments]),
    [demo.transcriptViSegments],
  );

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
    window.requestAnimationFrame(() => {
      sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  return (
    <section
      className="flex scroll-mt-24 flex-col gap-8 px-4 py-16 sm:scroll-mt-28 sm:px-16 lg:py-24"
      id="toeic"
      ref={sectionRef}
    >
      <div className="flex flex-col items-center gap-3 text-center">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          {t("landing.part3Title")}
        </h2>
        <p className="max-w-xl text-lg text-muted-foreground">
          {t("landing.part3Description")}
        </p>
      </div>

      <div className="mx-auto grid w-full max-w-6xl gap-6 rounded-2xl bg-surface p-5 shadow-card dark:border dark:border-border lg:grid-cols-2 lg:gap-8 lg:p-8">
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
            {t("landing.audioUnsupported")}
          </audio>

          <div className="overflow-hidden rounded-xl border border-border bg-background">
            <Image
              alt={t("landing.part3ImageAlt")}
              className="h-auto w-full"
              height={720}
              src={demo.imageSrc}
              width={960}
            />
          </div>

          {revealed ? (
            <PassagePanel
              cardClassName="bg-background"
              content={transcriptEn}
              contentSegments={[...demo.transcriptSegments]}
              contentVi={transcriptVi}
              contentViSegments={[...demo.transcriptViSegments]}
              showEvidenceToggle
              showTranslation
              title={t("landing.transcript")}
            />
          ) : null}
        </div>

        <div className="flex flex-col gap-4">
          {demo.questions.map((question) => {
            const options = toToeicOptions(question);

            return (
              <div className="flex flex-col gap-4" key={question.id}>
                <p className="text-base font-medium leading-snug">
                  <span className="mr-2">{question.number}.</span>
                  {question.prompt}
                </p>
                <QuestionOptions
                  answerKey={question.answerKey}
                  isLocked={revealed}
                  onSelect={(key) => handleSelect(question.id, key)}
                  optionCount={4}
                  options={options}
                  selectedKey={selections[question.id]}
                  showEnglishTextBeforeAnswer
                  showResult={revealed}
                />
                <QuestionTranslationPanel
                  answerKey={revealed ? question.answerKey : null}
                  className="bg-background"
                  optionCount={4}
                  options={options}
                  questionVi={question.promptVi}
                  variant="content-question-options"
                  visible={revealed}
                />
              </div>
            );
          })}

          {revealed ? (
            <div className="mt-auto flex flex-wrap items-center gap-3 pt-2">
              <button
                className={iconTextButtonClassName(
                  "border-border bg-transparent text-foreground hover:bg-hover-overlay",
                )}
                onClick={handleReset}
                type="button"
              >
                {t("landing.tryAgain")}
              </button>
              <Link
                className={iconTextButtonClassName(
                  "border-foreground bg-foreground text-background hover:[box-shadow:inset_0_0_0_9999px_var(--hover-overlay-solid)]",
                )}
                href="/login"
              >
                {t("landing.getStarted")}
              </Link>
            </div>
          ) : null}
        </div>
      </div>

      <p className="text-center text-sm text-muted-foreground">
        {t("landing.coverage")}
      </p>
    </section>
  );
}
