"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { classNames } from "@/shared/lib/classNames";
import { useResolvedTheme, useTheme } from "@/shared/providers/ThemeProvider";
import { CloseIcon } from "@/shared/ui/icons/CloseIcon";
import { DarkModeIcon } from "@/shared/ui/icons/DarkModeIcon";
import { LightModeIcon } from "@/shared/ui/icons/LightModeIcon";
import { LogoIcon } from "@/shared/ui/icons/LogoIcon";
import { MenuIcon } from "@/shared/ui/icons/MenuIcon";

function MobileNavThemeToggle() {
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

export function MobileTopNav() {
  const navRef = useRef<HTMLElement>(null);
  const [isAtTop, setIsAtTop] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

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

  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    const scroller = navRef.current?.parentElement;
    const previousOverflow = scroller?.style.overflow;

    if (scroller) {
      scroller.style.overflow = "hidden";
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      if (scroller) {
        scroller.style.overflow = previousOverflow ?? "";
      }
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuOpen]);

  return (
    <>
      <nav
        ref={navRef}
        className={classNames(
          "pointer-events-none sticky z-50 mx-4 shrink-0 transition-[top,margin-top] duration-200 sm:hidden",
          isAtTop ? "top-4 mt-4" : "top-2 mt-0",
        )}
      >
        <div className="pointer-events-auto flex items-center justify-between rounded-[16px] bg-surface p-2 shadow-card dark:border dark:border-border">
          <Link
            aria-label="EngVocab"
            className="flex items-center px-2 hover:opacity-80"
            href="/"
          >
            <LogoIcon className="size-6 shrink-0" />
          </Link>
          <div className="flex items-center gap-2">
            <MobileNavThemeToggle />
            <button
              aria-expanded={menuOpen}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              className="inline-flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-lg text-foreground hover:bg-hover-overlay"
              onClick={() => setMenuOpen((current) => !current)}
              type="button"
            >
              {menuOpen ? (
                <CloseIcon className="size-6 shrink-0" />
              ) : (
                <MenuIcon className="size-6 shrink-0" />
              )}
            </button>
          </div>
        </div>
      </nav>

      {menuOpen ? (
        <div
          aria-label="Menu"
          aria-modal="true"
          className="fixed inset-0 z-40 bg-surface sm:hidden"
          role="dialog"
        />
      ) : null}
    </>
  );
}
