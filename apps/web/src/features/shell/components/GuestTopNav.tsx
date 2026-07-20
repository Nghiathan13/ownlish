"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  isLoadingStatus,
  useAuthSession,
} from "@/features/auth/hooks/useAuthSession";
import { classNames } from "@/shared/lib/classNames";
import { useResolvedTheme, useTheme } from "@/shared/providers/ThemeProvider";
import { DarkModeIcon } from "@/shared/ui/icons/DarkModeIcon";
import { LightModeIcon } from "@/shared/ui/icons/LightModeIcon";
import { LogoIcon } from "@/shared/ui/icons/LogoIcon";

const signInButtonClassName = classNames(
  "inline-flex shrink-0 cursor-pointer items-center justify-center rounded-lg px-4 py-2",
  "text-[15px] leading-[20px] font-normal",
  "bg-foreground text-background",
  "hover:[box-shadow:inset_0_0_0_9999px_var(--hover-overlay-solid)]",
);

function GuestNavThemeToggle() {
  const { setTheme } = useTheme();
  const resolvedTheme = useResolvedTheme();
  const targetTheme = resolvedTheme === "dark" ? "light" : "dark";
  const tooltip = `Switch to ${targetTheme} theme`;
  const Icon = targetTheme === "light" ? LightModeIcon : DarkModeIcon;

  return (
    <button
      aria-label={tooltip}
      className="inline-flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-lg text-foreground hover:bg-hover-overlay"
      onClick={() => setTheme(targetTheme)}
      type="button"
    >
      <Icon className="size-6 shrink-0" />
    </button>
  );
}

export function GuestTopNav() {
  const { status } = useAuthSession();
  const navRef = useRef<HTMLElement>(null);
  const [isAtTop, setIsAtTop] = useState(true);

  useEffect(() => {
    const scroller = navRef.current?.parentElement;
    if (!scroller) {
      return;
    }

    const updatePosition = () => {
      setIsAtTop(scroller.scrollTop <= 0);
    };

    updatePosition();
    scroller.addEventListener("scroll", updatePosition, { passive: true });
    return () => {
      scroller.removeEventListener("scroll", updatePosition);
    };
  }, []);

  return (
    <nav
      ref={navRef}
      className={classNames(
        "pointer-events-none sticky z-50 mx-4 transition-[top,margin-top] duration-200 sm:mx-16",
        isAtTop ? "top-4 mt-4 sm:top-8 sm:mt-8" : "top-2 mt-0 sm:top-4",
      )}
    >
      <div className="pointer-events-auto flex items-center justify-between rounded-[16px] bg-surface p-2 shadow-card dark:border dark:border-border">
        <Link
          className="flex items-center gap-2 px-2 text-base font-bold hover:opacity-80"
          href="/"
        >
          <LogoIcon className="size-6 shrink-0" />
          EngVocab
        </Link>
        <div className="flex items-center gap-2">
          <GuestNavThemeToggle />
          {isLoadingStatus(status) ? null : (
            <Link className={signInButtonClassName} href="/login">
              Sign in
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
