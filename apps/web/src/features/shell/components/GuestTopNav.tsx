"use client";

import Link from "next/link";
import {
  isLoadingStatus,
  useAuthSession,
} from "@/features/auth/hooks/useAuthSession";
import { primaryTextButtonClassName } from "@/shared/ui/button";
import { APP_CONTAINER_CLASS } from "@/shared/ui/layout";

export function GuestTopNav() {
  const { status } = useAuthSession();

  return (
    <nav className="sticky top-0 z-50 w-full shrink-0 border-b border-border bg-surface">
      <div className={`${APP_CONTAINER_CLASS} flex items-center justify-between py-3`}>
        <Link className="text-base font-bold hover:opacity-80" href="/">
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
