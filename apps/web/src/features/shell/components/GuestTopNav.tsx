"use client";

import Link from "next/link";
import {
  isLoadingStatus,
  useAuthSession,
} from "@/features/auth/hooks/useAuthSession";
import { primaryTextButtonClassName } from "@/shared/ui/button";
import { LogoIcon } from "@/shared/ui/icons/LogoIcon";
import { APP_CONTAINER_CLASS } from "@/shared/ui/layout";

export function GuestTopNav() {
  const { status } = useAuthSession();

  return (
    <nav className="sticky top-0 z-50 w-full shrink-0 border-b border-border bg-surface">
      <div className={`${APP_CONTAINER_CLASS} flex items-center justify-between py-3`}>
        <Link
          className="flex items-center gap-2 text-base font-bold hover:opacity-80"
          href="/"
        >
          <LogoIcon className="size-6 shrink-0" />
          EngVocab
        </Link>
        {isLoadingStatus(status) ? null : (
          <Link className={primaryTextButtonClassName()} href="/login">
            Sign in
          </Link>
        )}
      </div>
    </nav>
  );
}
