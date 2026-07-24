"use client";

import { useRouter } from "next/navigation";
import {
  useImmersiveBilingual,
  useImmersiveExit,
  useImmersiveFinish,
} from "@/features/shell/providers/ImmersiveToolbarProvider";
import { classNames } from "@/shared/lib/classNames";
import {
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

  return (
    <nav className="sticky top-0 z-50 w-full shrink-0 border-b border-border bg-surface backdrop-blur-md">
      <div
        className={classNames(
          APP_CONTAINER_CLASS,
          "flex items-center gap-4 py-4",
        )}
      >
        <div className="flex items-center gap-4">
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
              className={iconTextButtonClassName(
                "border-foreground bg-foreground text-background",
              )}
              onClick={() => {
                void (exitContext?.exit() ?? router.push("/tests"));
              }}
              type="button"
            >
              <ArrowBackIcon />
              {t("tests.exit")}
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
                  {t("tests.bilingual")}
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </nav>
  );
}
