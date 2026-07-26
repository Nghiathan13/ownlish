"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { isAuthenticatedStatus, useAuthSession } from "@/features/auth/hooks/useAuthSession";
import { useMockTestHistory } from "@/features/tests/overview/hooks/useMockTestHistory";
import { areAllPartsSelected } from "@/features/tests/shared/lib/toeicParts";
import { testOverviewCardClassName } from "@/features/tests/overview/lib/testOverviewCard";
import { classNames } from "@/shared/lib/classNames";
import { formatMessage } from "@/shared/i18n/messages";
import { useT } from "@/shared/providers/LocaleProvider";
import { statusColorClasses } from "@/shared/ui/theme/statusColors";
import {
  secondaryTextButtonClassName,
  textButtonClassName,
} from "@/shared/ui/button";
import { CheckIcon } from "@/shared/ui/icons/CheckIcon";
import { CloseIcon } from "@/shared/ui/icons/CloseIcon";
import { OverlayScrollArea } from "@/shared/ui/OverlayScrollArea";

type MockHistoryFilter = "completed" | "in_progress";

type MockTestHistoryPanelProps = {
  testKey: string;
  onClose: () => void;
  onViewResult: (sessionId: string, selectedParts: number[]) => void;
};

export function MockTestHistoryPanel({
  testKey,
  onClose,
  onViewResult,
}: MockTestHistoryPanelProps) {
  const t = useT();
  const { status, user } = useAuthSession();
  const history = useMockTestHistory({
    isAuthenticated: isAuthenticatedStatus(status),
    userId: user?.id ?? null,
    testKey,
  });
  const [filter, setFilter] = useState<MockHistoryFilter>("completed");
  const items = history.items.filter((item) =>
    filter === "completed"
      ? item.status === "completed"
      : item.status === "open" || item.status === "pending",
  );

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-[100]" role="presentation">
      <button
        aria-label={t("tests.closeMockHistory")}
        className="absolute inset-0 bg-background/60 backdrop-blur-sm"
        onClick={onClose}
        type="button"
      />
      <aside
        className="absolute inset-y-0 left-0 flex w-[22rem] max-w-[85vw] flex-col bg-surface shadow-card dark:border-r dark:border-border"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <OverlayScrollArea
          className="h-full min-h-0 p-4"
          rootClassName="min-h-0 flex-1"
        >
          <div className="flex flex-col gap-4">
            <div
              aria-label={`${t("tests.completed")} / ${t("tests.inProgress")}`}
              className="flex w-full gap-1 rounded-[8px] border border-border bg-surface p-1"
              role="tablist"
            >
              {(
                [
                  { value: "completed" as const, label: t("tests.completed") },
                  { value: "in_progress" as const, label: t("tests.inProgress") },
                ] as const
              ).map((option) => {
                const isActive = filter === option.value;

                return (
                  <button
                    aria-selected={isActive}
                    className={classNames(
                      "inline-flex flex-1 shrink-0 cursor-pointer items-center justify-center rounded-[4px] px-2 py-1 text-[15px] leading-[20px] font-normal",
                      isActive
                        ? "bg-muted text-foreground hover:[box-shadow:inset_0_0_0_9999px_var(--hover-overlay)]"
                        : "bg-transparent text-foreground hover:bg-hover-overlay",
                    )}
                    key={option.value}
                    onClick={() => setFilter(option.value)}
                    role="tab"
                    type="button"
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
            {history.isLoading ? (
              <p className="text-sm text-muted-foreground">{t("tests.loading")}</p>
            ) : history.error ? (
              <div className="flex flex-col items-start gap-3">
                <p className="text-sm text-muted-foreground">{history.error}</p>
                <button
                  className={secondaryTextButtonClassName()}
                  onClick={() => void history.reload()}
                  type="button"
                >
                  {t("tests.retry")}
                </button>
              </div>
            ) : items.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {filter === "completed"
                  ? t("tests.noMockHistory")
                  : t("tests.noMockInProgress")}
              </p>
            ) : (
              items.map((item) => {
                const isFullTest = areAllPartsSelected(item.selectedParts);
                const isCompleted = item.status === "completed";

                return (
                <article
                  className={classNames(
                    testOverviewCardClassName,
                    "min-w-0 border border-border shadow-none",
                  )}
                  key={item.sessionId}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div
                      aria-label={
                        isFullTest
                          ? t("tests.fullParts")
                          : formatMessage(t("tests.selectedParts"), {
                              parts: item.selectedParts.join(", "),
                            })
                      }
                      className="flex flex-wrap items-center gap-1"
                    >
                      {isFullTest ? (
                        <kbd className="inline-flex h-6 items-center justify-center rounded-md border border-primary bg-primary/5 px-1.5 text-xs font-semibold text-primary">
                          {t("tests.fullParts")}
                        </kbd>
                      ) : (
                        item.selectedParts.map((partNumber) => (
                          <kbd
                            className="inline-flex h-6 min-w-6 items-center justify-center rounded-md border border-primary bg-primary/5 px-1.5 text-xs font-semibold tabular-nums text-primary"
                            key={partNumber}
                          >
                            {partNumber}
                          </kbd>
                        ))
                      )}
                    </div>
                    {isCompleted && isFullTest ? (
                      <p className="shrink-0 text-sm tabular-nums text-muted-foreground">
                        <span className="text-lg font-semibold text-primary">
                          {item.score.total}
                        </span>
                        /990
                      </p>
                    ) : null}
                  </div>
                  {isCompleted && isFullTest ? (
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      <span>
                        L:{" "}
                        <span className="font-semibold text-foreground">
                          {item.score.listening}
                        </span>
                      </span>
                      <span>
                        R:{" "}
                        <span className="font-semibold text-foreground">
                          {item.score.reading}
                        </span>
                      </span>
                    </div>
                  ) : isCompleted ? (
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <CheckIcon
                          className={classNames(
                            "size-4",
                            statusColorClasses.success.text,
                          )}
                        />
                        <span className={statusColorClasses.success.text}>
                          {item.correctCount}
                        </span>
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <CloseIcon
                          className={classNames(
                            "size-4",
                            statusColorClasses.danger.text,
                          )}
                        />
                        <span className={statusColorClasses.danger.text}>
                          {item.wrongCount}
                        </span>
                      </span>
                    </div>
                  ) : null}
                  <button
                    className={textButtonClassName(
                      "w-full border-border bg-transparent text-foreground hover:border-border hover:bg-hover-overlay",
                    )}
                    onClick={() => onViewResult(item.sessionId, item.selectedParts)}
                    type="button"
                  >
                    {item.status === "open"
                      ? t("tests.continueMock")
                      : item.status === "pending"
                        ? t("tests.openResult")
                        : t("tests.viewResult")}
                  </button>
                </article>
                );
              })
            )}
          </div>
        </OverlayScrollArea>
      </aside>
    </div>,
    document.body,
  );
}
