"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthSession } from "@/features/auth/hooks/useAuthSession";

export function Navbar() {
  const pathname = usePathname();
  const { clearSession, status, user } = useAuthSession();

  const isAuth = status === "authenticated";

  const linkClass = (href: string) => {
    const isActive = pathname === href;
    return `text-sm font-semibold transition-colors duration-200 ${
      isActive
        ? "text-foreground"
        : "text-muted-foreground hover:text-foreground"
    }`;
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-[992px] items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="text-base font-bold hover:opacity-80">
          EngVocab
        </Link>

        {/* Tabs */}
        {isAuth ? (
          <div className="flex items-center gap-6">
            <Link href="/vocabulary" className={linkClass("/vocabulary")}>
              Vocabulary
            </Link>
            <Link href="/review" className={linkClass("/review")}>
              Review
            </Link>
          </div>
        ) : null}

        {/* User Info & Actions */}
        <div className="flex items-center gap-4">
          {status === "checking" ? null : isAuth ? (
            <>
              <span className="hidden text-xs text-muted-foreground sm:inline">
                {user?.email}
              </span>
              <button
                type="button"
                onClick={clearSession}
                className="cursor-pointer rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-foreground transition hover:bg-muted"
              >
                Logout
              </button>
            </>
          ) : (
            pathname !== "/login" && (
              <Link
                href="/login"
                className="rounded-lg bg-foreground px-3 py-1.5 text-xs font-semibold text-background transition hover:opacity-90"
              >
                Sign in
              </Link>
            )
          )}
        </div>
      </div>
    </nav>
  );
}
