"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  isLoadingStatus,
  useAuthSession,
} from "@/features/auth/hooks/useAuthSession";
import { classNames } from "@/shared/lib/classNames";
import { primaryTextButtonClassName } from "@/shared/ui/button";
import { LogoIcon } from "@/shared/ui/icons/LogoIcon";

export function GuestTopNav() {
  const { status } = useAuthSession();
  const [isAtTop, setIsAtTop] = useState(true);

  useEffect(() => {
    const scroller = document.querySelector("main");
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
      className={classNames(
        "pointer-events-none fixed right-16 left-16 z-50 transition-[top] duration-200",
        isAtTop ? "top-8" : "top-4",
      )}
    >
      <div className="pointer-events-auto flex items-center justify-between rounded-[16px] bg-surface p-2 shadow-card">
        <Link
          className="flex items-center gap-2 px-2 text-base font-bold hover:opacity-80"
          href="/"
        >
          <LogoIcon className="size-6 shrink-0" />
          EngVocab
        </Link>
        {isLoadingStatus(status) ? null : (
          <Link
            className={primaryTextButtonClassName(
              "hover:[box-shadow:inset_0_0_0_9999px_var(--hover-overlay-solid)]",
            )}
            href="/login"
          >
            Sign in
          </Link>
        )}
      </div>
    </nav>
  );
}
