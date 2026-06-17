"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthSession } from "@/features/auth/hooks/useAuthSession";
import { isImmersiveTestPath } from "@/features/tests/lib/isImmersiveTestPath";
import { usePracticeExit } from "@/features/tests/providers/PracticeExitProvider";
import { classNames } from "@/shared/lib/classNames";
import { Button } from "@/shared/ui/Button";
import { ArrowBackIcon } from "@/shared/ui/icons/ArrowBackIcon";
import { APP_CONTAINER_CLASS } from "@/shared/ui/layout";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { logout, status, user } = useAuthSession();
  const practiceExit = usePracticeExit();
  const isImmersivePractice = isImmersiveTestPath(pathname);

  const isAuth = status === "authenticated";

  const linkClass = (href: string) => {
    const isActive =
      pathname === href ||
      (href !== "/" && pathname.startsWith(`${href}/`));
    return `text-sm font-semibold transition-colors duration-200 ${
      isActive
        ? "text-foreground"
        : "text-muted-foreground hover:text-foreground"
    }`;
  };

  if (isImmersivePractice) {
    return (
      <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
        <div className={classNames(APP_CONTAINER_CLASS, "flex items-center gap-4 py-4")}>
          <Button
            className="gap-2 py-2 text-base font-normal"
            onClick={() => {
              void (practiceExit?.exit() ?? router.push("/tests"));
            }}
            type="button"
          >
            <ArrowBackIcon className="size-4" />
            Exit
          </Button>
          {practiceExit?.practiceTitle ? (
            <span className="text-base font-semibold text-foreground">
              {practiceExit.practiceTitle}
            </span>
          ) : null}
        </div>
      </nav>
    );
  }

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
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

        {isAuth ? (
          <div className="order-3 flex w-full items-center gap-4 overflow-x-auto whitespace-nowrap sm:order-none sm:w-auto sm:gap-6 sm:overflow-visible">
            <Link href="/" className={linkClass("/")}>
              Dashboard
            </Link>
            <Link href="/vocabulary" className={linkClass("/vocabulary")}>
              Vocabulary
            </Link>
            <Link href="/collections" className={linkClass("/collections")}>
              Collections
            </Link>
            <Link href="/review" className={linkClass("/review")}>
              Review
            </Link>
            <Link href="/tests" className={linkClass("/tests")}>
              Tests
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
