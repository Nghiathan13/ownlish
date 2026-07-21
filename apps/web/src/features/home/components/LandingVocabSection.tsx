"use client";

import { useState } from "react";
import {
  LANDING_CATALOG_COLLECTIONS,
  LANDING_VOCAB_DEMO_METRICS,
  LANDING_VOCAB_DEMO_WORD,
} from "@/features/home/lib/landingDemoData";
import { classNames } from "@/shared/lib/classNames";
import { secondaryTextButtonClassName } from "@/shared/ui/button";

export function LandingVocabSection() {
  return (
    <section
      className="flex flex-col gap-8 px-8 py-16 sm:px-16 lg:py-24"
      id="vocabulary"
    >
      <div className="flex flex-col items-center gap-3 text-center">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Build vocabulary that sticks.
        </h2>
        <p className="max-w-xl text-lg text-muted-foreground">
          Collections, bilingual cards, and spaced review in one place.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-6">
        <LandingReviewCard />
        <LandingCollectionsCard />
        <LandingProgressCard />
      </div>
    </section>
  );
}

function LandingReviewCard() {
  const [showMeaning, setShowMeaning] = useState(false);
  const [graded, setGraded] = useState<"forgot" | "remember" | null>(null);
  const word = LANDING_VOCAB_DEMO_WORD;

  function reset() {
    setShowMeaning(false);
    setGraded(null);
  }

  return (
    <article className="flex flex-col rounded-2xl bg-surface p-5 shadow-card sm:p-6">
      <p className="text-sm font-medium text-muted-foreground">Spaced review</p>
      <div className="mt-4 flex flex-1 flex-col">
        <div className="flex flex-wrap items-start gap-x-2 gap-y-2">
          <h3 className="text-3xl font-black tracking-tight">
            {word.word}
            <span className="ml-2 align-middle text-sm font-medium tracking-normal text-muted-foreground">
              ({word.type})
            </span>
          </h3>
          <span className="mt-1 rounded-full border border-border bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">
            {word.band}
          </span>
        </div>
        <p className="mt-2 font-mono text-sm text-muted-foreground">
          /{word.ipaUk}/
        </p>

        {showMeaning ? (
          <div className="mt-5 grid gap-3 rounded-2xl border border-border bg-background p-4 text-left">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Meaning
              </p>
              <p className="mt-1 text-xl font-bold leading-tight">
                {word.meaningVi}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Definition
              </p>
              <p className="mt-1 text-sm leading-6 text-foreground">
                {word.definition}
              </p>
            </div>
            <div className="border-t border-border pt-3">
              <p className="text-sm leading-6">{word.example}</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                {word.exampleVi}
              </p>
            </div>
          </div>
        ) : (
          <button
            className="mt-5 min-h-24 w-full rounded-2xl border border-dashed border-border bg-muted/40 px-4 py-6 text-center text-sm font-medium text-muted-foreground"
            onClick={() => setShowMeaning(true)}
            type="button"
          >
            Click to reveal
          </button>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
          {!showMeaning ? (
            <span className="text-muted-foreground">Reveal the meaning first</span>
          ) : graded ? (
            <>
              <span className="font-medium text-foreground">
                {graded === "remember"
                  ? "Nice — scheduled for later review."
                  : "Noted — this word will come back sooner."}
              </span>
              <button
                className={secondaryTextButtonClassName("text-sm")}
                onClick={reset}
                type="button"
              >
                Try again
              </button>
            </>
          ) : (
            <>
              <button
                className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
                onClick={() => setGraded("forgot")}
                type="button"
              >
                <Kbd>1</Kbd>
                Forgot
              </button>
              <button
                className="inline-flex items-center gap-1 font-semibold text-foreground"
                onClick={() => setGraded("remember")}
                type="button"
              >
                <Kbd>2</Kbd>
                Remember
              </button>
            </>
          )}
        </div>
      </div>
    </article>
  );
}

function LandingCollectionsCard() {
  const [activeId, setActiveId] = useState<string>(
    LANDING_CATALOG_COLLECTIONS[0].id,
  );
  const [importedId, setImportedId] = useState<string | null>(null);
  const active =
    LANDING_CATALOG_COLLECTIONS.find((item) => item.id === activeId) ??
    LANDING_CATALOG_COLLECTIONS[0];

  return (
    <article className="flex flex-col rounded-2xl bg-surface p-5 shadow-card sm:p-6">
      <p className="text-sm font-medium text-muted-foreground">Collections</p>
      <h3 className="mt-2 text-xl font-semibold">My Vocabulary + catalogs</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        Keep your words in one place, then import curated sets when you need
        more coverage.
      </p>

      <div className="mt-5 rounded-xl border border-border p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-semibold">My Vocabulary</p>
            <p className="mt-1 text-sm text-muted-foreground">Your default collection</p>
          </div>
          <span className="text-sm text-muted-foreground">128 words</span>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {LANDING_CATALOG_COLLECTIONS.map((collection) => (
          <button
            className={classNames(
              "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
              activeId === collection.id
                ? "border-foreground bg-foreground text-background"
                : "border-border text-muted-foreground hover:border-foreground hover:text-foreground",
            )}
            key={collection.id}
            onClick={() => setActiveId(collection.id)}
            type="button"
          >
            {collection.title}
          </button>
        ))}
      </div>

      <div className="mt-4 flex flex-1 flex-col rounded-xl border border-border p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-semibold">{active.title}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {active.description}
            </p>
          </div>
          <span className="shrink-0 rounded-full border border-border px-2.5 py-1 text-xs font-semibold">
            {active.cefr}
          </span>
        </div>
        <div className="mt-4 flex items-center justify-between gap-3">
          <span className="text-sm text-muted-foreground">{active.wordCount}</span>
          <button
            className={secondaryTextButtonClassName("text-sm")}
            onClick={() => setImportedId(active.id)}
            type="button"
          >
            {importedId === active.id ? "Imported" : "Import"}
          </button>
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
    <article className="flex flex-col rounded-2xl bg-surface p-5 shadow-card sm:p-6">
      <p className="text-sm font-medium text-muted-foreground">Progress</p>
      <h3 className="mt-2 text-xl font-semibold">See what needs attention</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        Track due words, mastered items, and difficult vocabulary from your
        dashboard.
      </p>
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
