"use client";

import Image from "next/image";
import Link from "next/link";
import { LogoIcon } from "@/shared/ui/icons/LogoIcon";
import { iconTextButtonClassName } from "@/shared/ui/button";

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
    <div className="flex flex-col">
      <section className="relative isolate">
        <div
          aria-hidden
          className="pointer-events-none absolute top-0 left-0 aspect-square w-1/2 max-w-xl -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#1F48DA] blur-[10vw]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute right-0 bottom-0 aspect-square w-1/2 max-w-xl translate-x-1/2 translate-y-1/2 rounded-full bg-[#1F48DA] blur-[10vw]"
        />
        <div className="relative flex flex-col items-center gap-6 px-8 py-16 text-center sm:px-16 lg:py-24">
          <div className="flex items-center gap-3 rounded-full border-0 border-border bg-surface px-4 py-1.5 text-sm font-medium uppercase text-muted-foreground shadow-card dark:border">
            <LogoIcon className="size-4 shrink-0" />
            Learn smarter, not harder
          </div>
          <h1 className="max-w-4xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Grow your vocabulary.
            <br />
            <span className="whitespace-nowrap">Raise your TOEIC readiness.</span>
          </h1>
          <p className="max-w-2xl text-lg text-muted-foreground sm:text-xl">
            Use spaced repetition, bilingual learning content, and complete
            Part 1–7 practice to make steady progress.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/login"
              className={iconTextButtonClassName(
                "whitespace-nowrap border-foreground bg-foreground text-background hover:[box-shadow:inset_0_0_0_9999px_var(--hover-overlay-solid)]",
              )}
            >
              Get started
            </Link>
            <Link
              href="#features"
              className={iconTextButtonClassName(
                "whitespace-nowrap border-border bg-transparent text-foreground hover:bg-hover-overlay",
              )}
            >
              See how it works
            </Link>
          </div>
        </div>
      </section>

      <section
        className="flex flex-col gap-8 px-8 py-16 sm:px-16 lg:py-24"
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

      <section className="flex flex-col gap-8 px-8 py-16 sm:px-16 lg:py-24">
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

      <section className="px-2 py-16 lg:py-24">
        <div className="relative overflow-hidden rounded-3xl bg-[#1418A8]">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 z-0"
            style={{
              backgroundImage:
                "radial-gradient(circle at 1px 1px, rgba(255, 255, 255, 0.32) 1px, transparent 0)",
              backgroundPosition: "center top",
              backgroundSize: "16px 16px",
              maskImage:
                "radial-gradient(60% 60%, #000 0%, transparent 90%)",
              WebkitMaskImage:
                "radial-gradient(60% 60%, #000 0%, transparent 90%)",
            }}
          />
          <div className="relative z-10 grid items-center gap-10 px-6 py-12 lg:grid-cols-2 lg:gap-8 lg:px-12 lg:py-16">
            <div className="flex flex-col items-start gap-6">
              <h2 className="max-w-md text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
                Organize your vocabulary.
              </h2>
              <p className="max-w-md text-lg text-white/80 sm:text-xl">
                Build collections, track reviews, and keep every word in one
                place.
              </p>
              <Link
                href="/login"
                className={iconTextButtonClassName(
                  "border-[#1F48DA] bg-[#1F48DA] text-white hover:[box-shadow:inset_0_0_0_9999px_rgba(255,255,255,0.12)]",
                )}
              >
                Get started
              </Link>
            </div>
            <div className="relative flex min-h-64 items-center justify-center [perspective:1000px] lg:min-h-[22rem]">
              <Image
                alt="EngVocab collections page with vocabulary table"
                className="w-full max-w-xl rounded-md shadow-[0_12px_40px_rgba(0,0,0,0.35)] [transform:scaleY(0.94)_skewX(-4deg)_rotate(6deg)] lg:absolute lg:right-[-10%] lg:w-[118%] lg:max-w-none lg:[transform:scaleY(0.86)_skewX(-8deg)_rotate(11deg)]"
                height={1481}
                src="/collection_page.png"
                sizes="(min-width: 1024px) 50vw, 90vw"
                width={2491}
              />
            </div>
          </div>
        </div>
      </section>

      <footer className="mt-auto border-t border-border px-8 py-10 sm:px-16">
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
