"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthSession } from "@/features/auth/hooks/useAuthSession";

export function Navbar() {
  const pathname = usePathname();
  const { logout, status, user } = useAuthSession();

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
      <div className="mx-auto flex max-w-[992px] flex-wrap items-center justify-between gap-x-4 gap-y-3 px-4 py-3 sm:flex-nowrap">
        <div className="flex min-w-0 flex-1 items-center gap-3 sm:flex-none">
          <Link href="/" className="shrink-0 text-base font-bold hover:opacity-80">
            EngVocab
          </Link>
        </div>

        {isAuth ? (
          <div className="order-3 flex w-full items-center gap-4 overflow-x-auto whitespace-nowrap sm:order-none sm:w-auto sm:gap-6 sm:overflow-visible">
            <Link href="/" className={linkClass("/")}>
              Dashboard
            </Link>
            <Link href="/vocabulary" className={linkClass("/vocabulary")}>
              Vocabulary
            </Link>
            <Link href="/review" className={linkClass("/review")}>
              Review
            </Link>
          </div>
        ) : null}

        <div className="order-2 flex shrink-0 items-center gap-3 sm:order-none sm:gap-4">
          {status === "checking" ? null : isAuth ? (
            <>
              <span className="hidden text-xs text-muted-foreground sm:inline">
                {user?.email}
              </span>
              <button
                type="button"
                onClick={() => {
                  void logout();
                }}
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
