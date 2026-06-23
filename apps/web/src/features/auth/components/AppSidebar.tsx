"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  useAuthSession,
  isAuthenticatedStatus,
  isLoadingStatus,
} from "@/features/auth/hooks/useAuthSession";
import {
  APP_NAV_LINKS,
  getAppNavLinkClass,
} from "@/features/auth/lib/appNavLinks";
import { classNames } from "@/shared/lib/classNames";
import {
  primaryTextButtonClassName,
  secondaryTextButtonClassName,
} from "@/shared/ui/button";

export function AppSidebar() {
  const pathname = usePathname();
  const { logout, status, user } = useAuthSession();
  const isAuth = isAuthenticatedStatus(status);

  return (
    <aside className="flex h-full w-56 shrink-0 flex-col border-r border-border bg-background/80 backdrop-blur-md">
      <div className="flex flex-col gap-6 p-4">
        <Link href="/" className="text-base font-bold hover:opacity-80">
          EngVocab
        </Link>

        {isAuth ? (
          <nav className="flex flex-col gap-1">
            {APP_NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={classNames(
                  getAppNavLinkClass(pathname, link),
                  "rounded-lg px-3 py-2 hover:bg-muted",
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        ) : null}
      </div>

      <div className="mt-auto border-t border-border p-4">
        {isLoadingStatus(status) ? null : isAuth ? (
          <div className="flex flex-col gap-3">
            <span className="truncate text-xs text-muted-foreground">
              {user?.email}
            </span>
            <button
              type="button"
              onClick={() => {
                void logout();
              }}
              className={classNames(secondaryTextButtonClassName(), "w-full")}
            >
              Logout
            </button>
          </div>
        ) : pathname !== "/login" ? (
          <Link
            href="/login"
            className={classNames(primaryTextButtonClassName(), "w-full text-center")}
          >
            Sign in
          </Link>
        ) : null}
      </div>
    </aside>
  );
}
