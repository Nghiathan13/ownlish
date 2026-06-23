"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthSession, isAuthenticatedStatus, isLoadingStatus } from "@/features/auth/hooks/useAuthSession";
import {
  isImmersiveTestPath,
  isMockTestPath,
} from "@/features/tests/shared/lib/isImmersiveTestPath";
import {
  usePracticeBilingual,
  usePracticeExit,
  usePracticeFinish,
  usePracticeQuestionNav,
} from "@/features/tests/run/providers/PracticeExitProvider";
import {
  DEFAULT_TOEIC_YEAR,
  getTestsListPath,
} from "@/features/tests/shared/constants/toeicYears";
import { classNames } from "@/shared/lib/classNames";
import {
  iconTextButtonClassName,
  primaryTextButtonClassName,
  secondaryTextButtonClassName,
} from "@/shared/ui/button";
import { ArrowBackIcon } from "@/shared/ui/icons/ArrowBackIcon";
import { BilingualIcon } from "@/shared/ui/icons/BilingualIcon";
import { APP_CONTAINER_CLASS } from "@/shared/ui/layout";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { logout, status, user } = useAuthSession();
  const practiceExit = usePracticeExit();
  const practiceFinish = usePracticeFinish();
  const practiceQuestionNav = usePracticeQuestionNav();
  const practiceBilingual = usePracticeBilingual();
  const isBilingual = practiceBilingual?.isBilingual ?? false;
  const questionNav = practiceQuestionNav?.questionNav ?? null;
  const isImmersivePractice = isImmersiveTestPath(pathname);
  const isMockTest = isMockTestPath(pathname);

  const isAuth = isAuthenticatedStatus(status);

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
    if (isMockTest) {
      return (
        <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
          <div
            className={classNames(
              APP_CONTAINER_CLASS,
              "flex items-center justify-between gap-4 py-4",
            )}
          >
            <div className="flex items-center gap-4">
              {practiceExit?.practiceTitle ? (
                <button
                  className={iconTextButtonClassName(
                    "border-foreground bg-foreground text-background",
                  )}
                  onClick={() => {
                    void (practiceExit?.exit() ?? router.push("/tests"));
                  }}
                  type="button"
                >
                  <ArrowBackIcon />
                  Exit
                </button>
              ) : (
                <button
                  className={primaryTextButtonClassName()}
                  onClick={() => {
                    void practiceFinish?.finish();
                  }}
                  type="button"
                >
                  Finish
                </button>
              )}
              {practiceExit?.practiceTitle || practiceFinish?.mockTitle ? (
                <div className="flex items-center gap-4">
                  <span className="text-base font-semibold text-foreground">
                    {practiceExit?.practiceTitle ?? practiceFinish?.mockTitle}
                  </span>
                  {practiceExit?.practiceTitle ? (
                    <button
                      aria-pressed={isBilingual}
                      className={iconTextButtonClassName(
                        isBilingual
                          ? "border-foreground bg-foreground text-background"
                          : "border-border bg-transparent text-foreground",
                      )}
                      onClick={() => practiceBilingual?.toggleBilingual()}
                      type="button"
                    >
                      <BilingualIcon />
                      Bilingual
                    </button>
                  ) : null}
                </div>
              ) : null}
            </div>
            {questionNav ? (
              <span className="rounded-lg border border-border px-4 py-2 text-base font-normal">
                {questionNav.currentQuestionNumber}/{questionNav.totalQuestions}
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
            "flex items-center justify-between gap-4 py-4",
          )}
        >
          <div className="flex items-center gap-4">
            <button
              className={iconTextButtonClassName(
                "border-foreground bg-foreground text-background",
              )}
              onClick={() => {
                void (practiceExit?.exit() ?? router.push("/tests"));
              }}
              type="button"
            >
              <ArrowBackIcon />
              Exit
            </button>
            {practiceExit?.practiceTitle ? (
              <div className="flex items-center gap-4">
                <span className="text-base font-semibold text-foreground">
                  {practiceExit.practiceTitle}
                </span>
                <button
                  aria-pressed={isBilingual}
                  className={iconTextButtonClassName(
                    isBilingual
                      ? "border-foreground bg-foreground text-background"
                      : "border-border bg-transparent text-foreground",
                  )}
                  onClick={() => practiceBilingual?.toggleBilingual()}
                  type="button"
                >
                  <BilingualIcon />
                  Bilingual
                </button>
              </div>
            ) : null}
          </div>
          {questionNav ? (
            <span className="rounded-lg border border-border px-4 py-2 text-base font-normal">
              Question {questionNav.currentQuestionNumber}/
              {questionNav.totalQuestions}
            </span>
          ) : null}
        </div>
      </nav>
    );
  }

  return (
    <nav className="sticky top-0 z-50 mb-4 w-full border-b border-border bg-background/80 backdrop-blur-md">
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
            <Link
              href="/collections?tab=user"
              className={linkClass("/collections")}
            >
              Collections
            </Link>
            <Link href="/review" className={linkClass("/review")}>
              Review
            </Link>
            <Link
              href={getTestsListPath(DEFAULT_TOEIC_YEAR)}
              className={linkClass("/tests")}
            >
              Tests
            </Link>
          </div>
        ) : null}

        <div className="order-2 flex shrink-0 items-center gap-3 sm:order-none sm:gap-4">
          {isLoadingStatus(status) ? null : isAuth ? (
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
              <Link
                href="/login"
                className={primaryTextButtonClassName()}
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
