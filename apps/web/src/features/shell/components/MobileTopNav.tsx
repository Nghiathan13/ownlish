"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  useAuthSession,
  isAuthenticatedStatus,
  isLoadingStatus,
} from "@/features/auth/hooks/useAuthSession";
import { isAdminUser } from "@/features/auth/lib/isAdminUser";
import {
  ADMIN_NAV_LINKS,
  APP_NAV_LINKS,
  getAppNavLinkClass,
} from "@/features/shell/lib/appNavLinks";
import { ShellAuthSlotSkeleton } from "@/features/shell/components/ShellAuthSlotSkeleton";
import { ShellNavSkeleton } from "@/features/shell/components/ShellNavSkeleton";
import { classNames } from "@/shared/lib/classNames";
import {
  primaryTextButtonClassName,
  secondaryTextButtonClassName,
} from "@/shared/ui/button";
import { APP_CONTAINER_CLASS } from "@/shared/ui/layout";

export function MobileTopNav() {
  const pathname = usePathname();
  const { logout, status, user } = useAuthSession();
  const isAuth = isAuthenticatedStatus(status);
  const isLoading = isLoadingStatus(status);
  const isAdmin = isAdminUser(user);

  return (
    <nav className="sticky top-0 z-50 w-full shrink-0 border-b border-border bg-background/80 backdrop-blur-md">
      <div
        className={classNames(
          APP_CONTAINER_CLASS,
          "flex flex-wrap items-center justify-between gap-x-4 gap-y-3 py-3 sm:flex-nowrap",
        )}
      >
        <div className="flex min-w-0 flex-1 items-center gap-3 sm:flex-none">
          <Link href="/" className="shrink-0 text-base font-bold hover:opacity-80">
            EngVocab
          </Link>
        </div>

        {isLoading ? (
          <ShellNavSkeleton variant="mobile" />
        ) : isAuth ? (
          <div className="order-3 flex w-full items-center gap-4 overflow-x-auto whitespace-nowrap sm:order-none sm:w-auto sm:gap-6 sm:overflow-visible">
            {APP_NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={getAppNavLinkClass(pathname, link)}
              >
                {link.label}
              </Link>
            ))}
            {isAdmin ? (
              <span className="h-5 border-l border-border" aria-hidden />
            ) : null}
            {isAdmin
              ? ADMIN_NAV_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={getAppNavLinkClass(pathname, link)}
                  >
                    Admin {link.label}
                  </Link>
                ))
              : null}
          </div>
        ) : null}

        <div className="order-2 flex shrink-0 items-center gap-3 sm:order-none sm:gap-4">
          {isLoading ? (
            <ShellAuthSlotSkeleton variant="mobile" />
          ) : isAuth ? (
            <>
              <span className="hidden text-xs text-muted-foreground sm:inline">
                {user?.email}
              </span>
              <button
                type="button"
                onClick={() => {
                  void logout();
                }}
                className={secondaryTextButtonClassName()}
              >
                Logout
              </button>
            </>
          ) : (
            pathname !== "/login" && (
              <Link href="/login" className={primaryTextButtonClassName()}>
                Sign in
              </Link>
            )
          )}
        </div>
      </div>
    </nav>
  );
}
