"use client";

import { useRouter } from "next/navigation";
import {
  useImmersiveBilingual,
  useImmersiveExit,
  useImmersiveFinish,
} from "@/features/shell/providers/ImmersiveToolbarProvider";
import { classNames } from "@/shared/lib/classNames";
import {
  iconOnlyButtonClassName,
  iconTextButtonClassName,
  primaryTextButtonClassName,
} from "@/shared/ui/button";
import { ArrowBackIcon } from "@/shared/ui/icons/ArrowBackIcon";
import { BilingualIcon } from "@/shared/ui/icons/BilingualIcon";
import { APP_CONTAINER_CLASS } from "@/shared/ui/layout";
import { useT } from "@/shared/providers/LocaleProvider";

export function ImmersiveToolbar() {
  const t = useT();
  const router = useRouter();
  const exitContext = useImmersiveExit();
  const finishContext = useImmersiveFinish();
  const bilingualContext = useImmersiveBilingual();
  const isBilingual = bilingualContext?.isBilingual ?? false;
  const exitTitle = exitContext?.title ?? null;
  const finishTitle = finishContext?.title ?? null;
  const title = exitTitle ?? finishTitle;
  const showsFinish = !exitTitle && finishTitle != null;
  const showsBilingual = Boolean(
    exitTitle && exitContext?.showBilingualAction,
  );
  const timerLabel = showsFinish ? finishContext?.timerLabel : null;

  return (
    <nav className="sticky top-0 z-50 w-full shrink-0 border-b border-border bg-surface backdrop-blur-md">
      <div
        className={classNames(
          APP_CONTAINER_CLASS,
          "flex items-center justify-between gap-4 py-4",
        )}
      >
        <div className="flex min-w-0 items-center gap-4">
          {showsFinish ? (
            <button
              aria-busy={finishContext?.isPending ?? false}
              className={primaryTextButtonClassName()}
              disabled={finishContext?.disabled ?? false}
              onClick={() => {
                void finishContext?.finish();
              }}
              type="button"
            >
              {finishContext?.isPending
                ? t("tests.finishing")
                : t("tests.finish")}
            </button>
          ) : (
            <button
              aria-label={t("tests.exit")}
              className={iconOnlyButtonClassName(
                "border border-foreground bg-foreground text-background hover:[box-shadow:inset_0_0_0_9999px_var(--hover-overlay-solid)]",
              )}
              onClick={() => {
                void (exitContext?.exit() ?? router.push("/tests"));
              }}
              type="button"
            >
              <ArrowBackIcon />
            </button>
          )}

          {title ? (
            <div className="flex min-w-0 items-center gap-4">
              <span className="truncate text-base font-semibold text-foreground">
                {title}
              </span>
              {showsBilingual ? (
                <button
                  aria-pressed={isBilingual}
                  className={iconTextButtonClassName(
                    isBilingual
                      ? "border-primary bg-primary/5 text-foreground hover:[box-shadow:inset_0_0_0_9999px_var(--hover-overlay)]"
                      : "border-border bg-transparent text-foreground hover:bg-hover-overlay",
                  )}
                  onClick={() => bilingualContext?.toggleBilingual()}
                  type="button"
                >
                  <BilingualIcon />
                  {t("tests.bilingual")}
                </button>
              ) : null}
            </div>
          ) : null}
        </div>

        {timerLabel ? (
          <span className="inline-flex shrink-0 items-center justify-center rounded-lg border border-primary bg-primary/5 px-4 py-2 text-base font-semibold tabular-nums text-primary">
            {timerLabel}
          </span>
        ) : null}
      </div>
    </nav>
  );
}
