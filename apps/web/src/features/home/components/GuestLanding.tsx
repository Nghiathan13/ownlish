"use client";

import Link from "next/link";
import { LogoIcon } from "@/shared/ui/icons/LogoIcon";
import {
  primaryTextButtonClassName,
  secondaryTextButtonClassName,
} from "@/shared/ui/button";

const HERO_GRADIENT_STYLE = {
  background:
    "linear-gradient(rgb(2, 8, 13) 0%, rgb(25, 29, 193) 24%, rgb(41, 126, 232) 50%, rgb(234, 239, 252) 100%)",
} as const;

const FEATURES = [
  {
    icon: "📚",
    title: "Spaced Repetition",
    description:
      "Review vocabulary on an optimized schedule that adapts to your progress and helps words stick long-term.",
  },
  {
    icon: "🌐",
    title: "Bilingual Dictionary",
    description:
      "Every word comes with Vietnamese meanings, IPA pronunciation, examples, and CEFR levels.",
  },
  {
    icon: "📝",
    title: "TOEIC Practice",
    description:
      "Practice all 7 TOEIC parts across 80+ real exams from 8 years, with mock tests and answer review.",
  },
  {
    icon: "📊",
    title: "Progress Tracking",
    description:
      "See your accuracy, study streaks, and per-part progress on a clean dashboard that keeps you motivated.",
  },
] as const;

const SHOWCASE_POINTS = [
  "80+ real TOEIC exams across 8 years (ETS & YBM)",
  "All 7 parts — Listening (1-4) and Reading (5-7)",
  "Mock tests with timed sessions and instant grading",
  "Review wrong answers and retake until you master them",
] as const;


export function GuestLanding() {
  return (
    <div className="flex flex-col pt-24">
      <section className="flex flex-col items-center gap-6 px-8 py-16 text-center lg:py-24">
        <div className="flex items-center gap-3 rounded-full border border-border bg-surface px-4 py-1.5 text-sm font-medium text-muted-foreground shadow-card">
          <LogoIcon className="size-4 shrink-0" />
          Learn smarter, not harder
        </div>
        <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
          Master English vocabulary &amp; ace the TOEIC
        </h1>
        <p className="max-w-2xl text-lg text-muted-foreground sm:text-xl">
          Learn smarter with spaced repetition, bilingual dictionaries, and
          realistic TOEIC practice tests — all in one place.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/login"
            className={primaryTextButtonClassName(
              "gap-2 whitespace-nowrap transition duration-200 ease-out hover:-translate-y-0.5 active:translate-y-px",
            )}
          >
            Get started
          </Link>
          <Link
            href="#features"
            className={secondaryTextButtonClassName(
              "gap-2 whitespace-nowrap transition duration-200 ease-out hover:-translate-y-0.5 active:translate-y-px",
            )}
          >
            See how it works
          </Link>
        </div>
      </section>

      <section
        className="flex flex-col gap-8 px-8 py-16 lg:px-16 lg:py-24"
        id="features"
      >
        <div className="flex flex-col items-center gap-3 text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Everything you need to learn
          </h2>
          <p className="max-w-xl text-lg text-muted-foreground">
            Four pillars that take you from your first word to a confident TOEIC
            score.
          </p>
        </div>
        <div className="@container grid grid-cols-1 gap-4 sm:grid-cols-2 lg:gap-8 @[1024px]:grid-cols-4">
          {FEATURES.map((feature) => (
            <article
              className="flex flex-col gap-4 rounded-2xl bg-surface p-6 shadow-card"
              key={feature.title}
            >
              <span className="text-3xl" aria-hidden>
                {feature.icon}
              </span>
              <h3 className="text-xl font-semibold">{feature.title}</h3>
              <p className="text-base leading-relaxed text-muted-foreground">
                {feature.description}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-8 px-8 py-16 lg:px-16 lg:py-24">
        <div className="flex flex-col items-center gap-3 text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Real TOEIC practice, built in
          </h2>
          <p className="max-w-xl text-lg text-muted-foreground">
            Practice with authentic-style TOEIC exams and track every answer.
          </p>
        </div>
        <ul className="mx-auto flex w-full max-w-2xl flex-col gap-4">
          {SHOWCASE_POINTS.map((point) => (
            <li
              className="flex items-start gap-3 rounded-2xl bg-surface p-5 shadow-card"
              key={point}
            >
              <span
                aria-hidden
                className="mt-1 flex size-5 shrink-0 items-center justify-center rounded-full bg-foreground text-xs font-bold text-background"
              >
                ✓
              </span>
              <span className="text-base leading-relaxed">{point}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="px-8 py-16 lg:px-16 lg:py-24">
        <div
          className="flex flex-col items-center gap-6 rounded-3xl px-6 py-12 text-center lg:py-16"
          style={HERO_GRADIENT_STYLE}
        >
          <h2 className="max-w-2xl text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
            Start learning today
          </h2>
          <p className="max-w-xl text-lg text-white/80 sm:text-xl">
            Create a free account and take your first TOEIC practice test in
            minutes.
          </p>
          <Link
            href="/login"
            className="inline-flex shrink-0 items-center justify-center rounded-lg bg-white px-6 py-3 text-base font-semibold text-black transition duration-200 ease-out hover:-translate-y-0.5 active:translate-y-px"
          >
            Get started
          </Link>
        </div>
      </section>

      <footer className="mt-auto border-t border-border px-8 py-10 lg:px-16">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <Link
            className="flex items-center gap-2 text-base font-bold hover:opacity-80"
            href="/"
          >
            <LogoIcon className="size-6 shrink-0" />
            EngVocab
          </Link>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} EngVocab. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}