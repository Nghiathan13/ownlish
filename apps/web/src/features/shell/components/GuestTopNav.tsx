"use client";

import Link from "next/link";
import {
  isLoadingStatus,
  useAuthSession,
} from "@/features/auth/hooks/useAuthSession";
import { primaryTextButtonClassName } from "@/shared/ui/button";
import { LogoIcon } from "@/shared/ui/icons/LogoIcon";

export function GuestTopNav() {
  const { status } = useAuthSession();

  return (
    <nav className="pointer-events-none fixed top-8 right-16 left-16 z-50">
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
