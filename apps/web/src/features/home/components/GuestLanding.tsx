"use client";

import Image from "next/image";
import Link from "next/link";
import type { ComponentType, SVGProps } from "react";
import { LandingPart3Demo } from "@/features/home/components/LandingPart3Demo";
import { LandingVocabSection } from "@/features/home/components/LandingVocabSection";
import { useResolvedTheme } from "@/shared/providers/ThemeProvider";
import { FacebookIcon } from "@/shared/ui/icons/FacebookIcon";
import { LogoIcon } from "@/shared/ui/icons/LogoIcon";
import { TikTokIcon } from "@/shared/ui/icons/TikTokIcon";
import { YouTubeIcon } from "@/shared/ui/icons/YouTubeIcon";
import { iconTextButtonClassName } from "@/shared/ui/button";
import { classNames } from "@/shared/lib/classNames";

const socialIconButtonClassName = classNames(
  "inline-flex size-9 shrink-0 items-center justify-center rounded-lg",
  "border border-border text-foreground hover:bg-hover-overlay",
);

type SocialIconProps = SVGProps<SVGSVGElement> & {
  variant?: "light" | "dark";
};

const SOCIAL_LINKS: {
  href: string;
  label: string;
  Icon: ComponentType<SocialIconProps>;
  themed?: boolean;
}[] = [
  {
    href: "#",
    label: "TikTok",
    Icon: TikTokIcon,
    themed: true,
  },
  {
    href: "#",
    label: "Facebook",
    Icon: FacebookIcon,
  },
  {
    href: "#",
    label: "YouTube",
    Icon: YouTubeIcon,
  },
];

export function GuestLanding() {
  const resolvedTheme = useResolvedTheme();

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
          </div>
        </div>
      </section>

      <LandingVocabSection />
      <LandingPart3Demo />

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
                className="w-full max-w-xl rounded-md shadow-[0_12px_40px_rgba(0,0,0,0.35)] brightness-90 [transform:translateY(40px)_scaleY(0.94)_skewX(-4deg)_rotate(6deg)] lg:absolute lg:right-[-10%] lg:w-[118%] lg:max-w-none lg:[transform:translateY(40px)_scaleY(0.86)_skewX(-8deg)_rotate(11deg)]"
                height={1481}
                src="/collection_page.png"
                sizes="(min-width: 1024px) 50vw, 90vw"
                width={2491}
              />
            </div>
          </div>
        </div>
      </section>

      <footer className="mt-auto py-10">
        <div className="flex flex-col items-center gap-3 px-8 sm:items-start sm:px-16">
          <Link
            className="flex items-center gap-2 text-base font-bold hover:opacity-80"
            href="/"
          >
            <LogoIcon className="size-6 shrink-0" />
            EngVocab
          </Link>
          <div className="flex items-center gap-2">
            {SOCIAL_LINKS.map(({ href, label, Icon, themed }) => (
              <a
                aria-label={label}
                className={socialIconButtonClassName}
                href={href}
                key={label}
                rel="noopener noreferrer"
              >
                <Icon
                  className="size-5"
                  {...(themed ? { variant: resolvedTheme } : {})}
                />
              </a>
            ))}
          </div>
        </div>
        <div
          aria-hidden
          className="mx-4 mt-6 border-t border-border sm:mx-16"
        />
        <p className="mt-4 px-8 text-center text-sm text-muted-foreground sm:px-16 sm:text-left">
          © {new Date().getFullYear()} EngVocab
        </p>
      </footer>
    </div>
  );
}
