"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { useT } from "@/shared/providers/LocaleProvider";

const DEFAULT_LEFT_PANEL_WIDTH = 70;
const MIN_LEFT_PANEL_WIDTH = 30;
const MAX_LEFT_PANEL_WIDTH = 70;
const SPLIT_PANEL_STORAGE_KEY = "engvocab:dictation-split-left-panel-width";
const DRAG_START_THRESHOLD_PX = 6;

type DictationSplitLayoutProps = {
  left: ReactNode;
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

export function DictationSplitLayout({ left, right }: DictationSplitLayoutProps) {
  const t = useT();
  const splitContainerRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<SplitDragStart | null>(null);
  const [leftPanelWidth, setLeftPanelWidth] = useState(getInitialLeftPanelWidth);

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
    "--dictation-split-left-panel-width": `${leftPanelWidth}%`,
  } as CSSProperties;

  return (
    <div
      className="grid min-h-0 flex-1 grid-cols-1 gap-6 lg:grid-cols-[calc(var(--dictation-split-left-panel-width)_-_0.5rem)_1rem_minmax(0,1fr)] lg:grid-rows-[minmax(0,1fr)] lg:gap-0"
      ref={splitContainerRef}
      style={splitLayoutStyle}
    >
      <div className="min-w-0 lg:pr-2">{left}</div>
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
      <div className="min-h-0 min-w-0 lg:h-full lg:self-stretch">{right}</div>
    </div>
  );
}
