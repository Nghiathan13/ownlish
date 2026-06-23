"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  usePracticeBilingual,
  usePracticeExit,
  usePracticeFinish,
  usePracticeQuestionNav,
} from "@/features/tests/run/providers/PracticeExitProvider";
import { isMockTestPath } from "@/features/tests/shared/lib/isImmersiveTestPath";
import { classNames } from "@/shared/lib/classNames";
import {
  iconTextButtonClassName,
  primaryTextButtonClassName,
} from "@/shared/ui/button";
import { ArrowBackIcon } from "@/shared/ui/icons/ArrowBackIcon";
import { BilingualIcon } from "@/shared/ui/icons/BilingualIcon";
import { APP_CONTAINER_CLASS } from "@/shared/ui/layout";

export function TestSessionToolbar() {
  const pathname = usePathname();
  const router = useRouter();
  const practiceExit = usePracticeExit();
  const practiceFinish = usePracticeFinish();
  const practiceQuestionNav = usePracticeQuestionNav();
  const practiceBilingual = usePracticeBilingual();
  const isBilingual = practiceBilingual?.isBilingual ?? false;
  const questionNav = practiceQuestionNav?.questionNav ?? null;
  const isMockTest = isMockTestPath(pathname);

  if (isMockTest) {
    return (
      <nav className="sticky top-0 z-50 w-full shrink-0 border-b border-border bg-background/80 backdrop-blur-md">
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
    <nav className="sticky top-0 z-50 w-full shrink-0 border-b border-border bg-background/80 backdrop-blur-md">
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
