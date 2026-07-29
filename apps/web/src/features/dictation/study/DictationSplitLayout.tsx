"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { classNames } from "@/shared/lib/classNames";
import { useT } from "@/shared/providers/LocaleProvider";
import { iconOnlyButtonClassName } from "@/shared/ui/button";
import { RightPanelCloseIcon } from "@/shared/ui/icons/RightPanelCloseIcon";
import { RightPanelOpenIcon } from "@/shared/ui/icons/RightPanelOpenIcon";
import { iconButtonGroupClassName, tooltipBaseClassName } from "@/shared/ui/Tooltip";

const DEFAULT_LEFT_PANEL_WIDTH = 70;
const MIN_LEFT_PANEL_WIDTH = 30;
const MAX_LEFT_PANEL_WIDTH = 70;
const SPLIT_PANEL_STORAGE_KEY = "engvocab:dictation-split-left-panel-width";
const DRAG_START_THRESHOLD_PX = 6;

type DictationSplitLayoutProps = {
  header?: ReactNode;
  isMobileRightPanelOpen: boolean;
  left: ReactNode;
  onMobileRightPanelOpenChange: (isOpen: boolean) => void;
  right: ReactNode;
};

type SplitDragStart = {
  clientX: number;
  leftPanelWidth: number;
};

function clampLeftPanelWidth(value: number) {
  return Math.min(
    MAX_LEFT_PANEL_WIDTH,
    Math.max(MIN_LEFT_PANEL_WIDTH, value),
  );
}

function getInitialLeftPanelWidth() {
  if (typeof window === "undefined") {
    return DEFAULT_LEFT_PANEL_WIDTH;
  }

  const storedValue = window.localStorage.getItem(SPLIT_PANEL_STORAGE_KEY);
  const storedWidth = storedValue == null ? null : Number(storedValue);

  return storedWidth != null && Number.isFinite(storedWidth)
    ? clampLeftPanelWidth(storedWidth)
    : DEFAULT_LEFT_PANEL_WIDTH;
}

export function DictationSplitLayout({
  header,
  isMobileRightPanelOpen,
  left,
  onMobileRightPanelOpenChange,
  right,
}: DictationSplitLayoutProps) {
  const t = useT();
  const splitContainerRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<SplitDragStart | null>(null);
  const [leftPanelWidth, setLeftPanelWidth] = useState(getInitialLeftPanelWidth);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(true);

  useEffect(() => {
    window.localStorage.setItem(
      SPLIT_PANEL_STORAGE_KEY,
      String(leftPanelWidth),
    );
  }, [leftPanelWidth]);

  function updateSplitFromDrag(clientX: number) {
    const container = splitContainerRef.current;
    const dragStart = dragStartRef.current;
    if (!container || !dragStart) {
      return;
    }

    const { width } = container.getBoundingClientRect();
    if (width === 0) {
      return;
    }

    const movement = clientX - dragStart.clientX;
    if (Math.abs(movement) <= DRAG_START_THRESHOLD_PX) {
      return;
    }

    setLeftPanelWidth(
      clampLeftPanelWidth(dragStart.leftPanelWidth + (movement / width) * 100),
    );
  }

  const splitLayoutStyle = {
    "--dictation-horizontal-divider-margin": isRightPanelOpen ? "-1rem" : "0px",
    "--dictation-split-left-panel-width": `${leftPanelWidth}%`,
  } as CSSProperties;
  const splitColumnsClassName = isRightPanelOpen
    ? "lg:grid-cols-[calc(var(--dictation-split-left-panel-width)_-_0.5rem)_1rem_minmax(0,1fr)]"
    : "lg:grid-cols-1";
  const togglePanelLabel = isRightPanelOpen
    ? t("dictation.hideTranscriptPanel")
    : t("dictation.showTranscriptPanel");

  return (
    <div
      className="flex min-h-0 flex-1 flex-col"
      style={splitLayoutStyle}
    >
      {header ? (
        <div
          className={classNames(
            "relative mb-4 grid shrink-0 grid-cols-1 gap-6 lg:gap-0",
            splitColumnsClassName,
          )}
        >
          <div className={classNames("min-w-0 lg:pr-2", !isRightPanelOpen && "lg:pr-16")}>
            {header}
          </div>
          {isRightPanelOpen ? <div className="hidden lg:block" /> : null}
          <div
            className={classNames(
              "hidden items-center justify-end lg:flex",
              isRightPanelOpen ? "lg:pr-4" : "absolute inset-y-0 right-4",
            )}
          >
            <button
              aria-expanded={isRightPanelOpen}
              aria-label={togglePanelLabel}
              className={classNames(
                iconOnlyButtonClassName(
                  "relative size-10 border border-border bg-surface hover:[box-shadow:inset_0_0_0_9999px_var(--hover-overlay)] [&_svg]:size-6 dark:bg-[#000000]",
                ),
                iconButtonGroupClassName,
              )}
              onClick={() => setIsRightPanelOpen((isOpen) => !isOpen)}
              type="button"
            >
              {isRightPanelOpen ? (
                <RightPanelCloseIcon className="size-6" />
              ) : (
                <RightPanelOpenIcon className="size-6" />
              )}
              <span
                aria-hidden
                className={classNames(
                  tooltipBaseClassName,
                  "right-0 top-full mt-2 group-hover/icon-button:block group-focus-visible/icon-button:block",
                )}
              >
                {togglePanelLabel}
              </span>
            </button>
          </div>
        </div>
      ) : null}
      <div
        className={classNames(
          "grid min-h-0 flex-1 grid-cols-1 gap-6 lg:grid-rows-[minmax(0,1fr)] lg:gap-0",
          splitColumnsClassName,
        )}
        ref={splitContainerRef}
      >
        <div
          className={classNames(
            "min-w-0",
            isRightPanelOpen ? "lg:pr-2" : "lg:pr-4",
          )}
        >
          {left}
        </div>
        {isRightPanelOpen ? (
          <div
          aria-label={t("tests.resizePanels")}
          aria-orientation="vertical"
          className="relative hidden cursor-col-resize touch-none select-none lg:block before:absolute before:top-0 before:bottom-0 before:left-1/2 before:w-px before:-translate-x-1/2 before:bg-border hover:before:bg-primary"
          onDoubleClick={() => {
            dragStartRef.current = null;
            setLeftPanelWidth(DEFAULT_LEFT_PANEL_WIDTH);
          }}
          onPointerDown={(event) => {
            if (event.pointerType === "mouse" && event.button !== 0) {
              return;
            }

            event.currentTarget.setPointerCapture(event.pointerId);
            dragStartRef.current = {
              clientX: event.clientX,
              leftPanelWidth,
            };
          }}
          onPointerMove={(event) => {
            if (event.currentTarget.hasPointerCapture(event.pointerId)) {
              updateSplitFromDrag(event.clientX);
            }
          }}
          onPointerUp={(event) => {
            if (event.currentTarget.hasPointerCapture(event.pointerId)) {
              event.currentTarget.releasePointerCapture(event.pointerId);
            }

            dragStartRef.current = null;
          }}
          onPointerCancel={() => {
            dragStartRef.current = null;
          }}
          role="separator"
          />
        ) : null}
        {isMobileRightPanelOpen ? (
          <button
            aria-label={t("dictation.hideTranscriptPanel")}
            className="fixed inset-0 z-40 cursor-default lg:hidden"
            onClick={() => onMobileRightPanelOpenChange(false)}
            type="button"
          />
        ) : null}
        <div
          className={classNames(
            "fixed inset-y-0 right-0 z-50 flex w-full max-w-[400px] min-w-0 flex-col bg-background transition-transform duration-200 ease-out lg:static lg:z-auto lg:block lg:max-w-none lg:bg-transparent lg:transition-none",
            isMobileRightPanelOpen
              ? "translate-x-0"
              : "pointer-events-none translate-x-full lg:pointer-events-auto lg:translate-x-0",
            isRightPanelOpen ? "lg:h-full lg:self-stretch" : "lg:hidden",
          )}
        >
          <div className="flex shrink-0 justify-end p-4 lg:hidden">
            <button
              aria-label={t("dictation.hideTranscriptPanel")}
              className={classNames(
                iconOnlyButtonClassName(
                  "relative size-10 border border-border bg-surface hover:[box-shadow:inset_0_0_0_9999px_var(--hover-overlay)] [&_svg]:size-6 dark:bg-[#000000]",
                ),
                iconButtonGroupClassName,
              )}
              onClick={() => onMobileRightPanelOpenChange(false)}
              type="button"
            >
              <RightPanelCloseIcon className="size-6" />
              <span
                aria-hidden
                className={classNames(
                  tooltipBaseClassName,
                  "right-0 top-full mt-2 group-hover/icon-button:block group-focus-visible/icon-button:block",
                )}
              >
                {t("dictation.hideTranscriptPanel")}
              </span>
            </button>
          </div>
          <div className="min-h-0 flex-1 lg:h-full">{right}</div>
        </div>
      </div>
    </div>
  );
}
