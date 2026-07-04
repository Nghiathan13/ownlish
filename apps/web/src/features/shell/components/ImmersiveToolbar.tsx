"use client";

import { useRouter } from "next/navigation";
import {
  useImmersiveBilingual,
  useImmersiveExit,
  useImmersiveFinish,
  useImmersiveQuestionNav,
} from "@/features/shell/providers/ImmersiveToolbarProvider";
import { classNames } from "@/shared/lib/classNames";
import {
  iconTextButtonClassName,
  primaryTextButtonClassName,
} from "@/shared/ui/button";
import { ArrowBackIcon } from "@/shared/ui/icons/ArrowBackIcon";
import { BilingualIcon } from "@/shared/ui/icons/BilingualIcon";
import { APP_CONTAINER_CLASS } from "@/shared/ui/layout";

export function ImmersiveToolbar() {
  const router = useRouter();
  const exitContext = useImmersiveExit();
  const finishContext = useImmersiveFinish();
  const questionNavContext = useImmersiveQuestionNav();
  const bilingualContext = useImmersiveBilingual();
  const isBilingual = bilingualContext?.isBilingual ?? false;
  const questionNav = questionNavContext?.questionNav ?? null;
  const exitTitle = exitContext?.title ?? null;
  const finishTitle = finishContext?.title ?? null;
  const title = exitTitle ?? finishTitle;
  const showsFinish = !exitTitle && finishTitle != null;
  const showsBilingual = Boolean(
    exitTitle && exitContext?.showBilingualAction,
  );

  return (
    <nav className="sticky top-0 z-50 w-full shrink-0 border-b border-border bg-surface backdrop-blur-md">
      <div
        className={classNames(
          APP_CONTAINER_CLASS,
          "flex items-center justify-between gap-4 py-4",
        )}
      >
        <div className="flex items-center gap-4">
          {showsFinish ? (
            <button
              className={primaryTextButtonClassName()}
              onClick={() => {
                void finishContext?.finish();
              }}
              type="button"
            >
              Finish
            </button>
          ) : (
            <button
              className={iconTextButtonClassName(
                "border-foreground bg-foreground text-background",
              )}
              onClick={() => {
                void (exitContext?.exit() ?? router.push("/tests"));
              }}
              type="button"
            >
              <ArrowBackIcon />
              Exit
            </button>
          )}

          {title ? (
            <div className="flex items-center gap-4">
              <span className="text-base font-semibold text-foreground">
                {title}
              </span>
              {showsBilingual ? (
                <button
                  aria-pressed={isBilingual}
                  className={iconTextButtonClassName(
                    isBilingual
                      ? "border-foreground bg-foreground text-background"
                      : "border-border bg-transparent text-foreground",
                  )}
                  onClick={() => bilingualContext?.toggleBilingual()}
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
            Question {questionNav.currentQuestionNumber}/
            {questionNav.totalQuestions}
          </span>
        ) : null}
      </div>
    </nav>
  );
}
