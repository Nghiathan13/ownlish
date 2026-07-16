"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

const DEFAULT_LEFT_PANEL_WIDTH = 50;
const MIN_LEFT_PANEL_WIDTH = 30;
const MAX_LEFT_PANEL_WIDTH = 70;
const SPLIT_PANEL_STORAGE_KEY = "engvocab:tests-split-left-panel-width";

type PracticeSplitPlainLayoutProps = {
  left: ReactNode;
  navigation?: ReactNode;
  right: ReactNode;
};

function clampLeftPanelWidth(value: number) {
  return Math.min(
    MAX_LEFT_PANEL_WIDTH,
    Math.max(MIN_LEFT_PANEL_WIDTH, value),
  );
}

export function PracticeSplitPlainLayout({
  left,
  navigation,
  right,
}: PracticeSplitPlainLayoutProps) {
  const splitContainerRef = useRef<HTMLDivElement>(null);
  const [leftPanelWidth, setLeftPanelWidth] = useState(DEFAULT_LEFT_PANEL_WIDTH);
  const [isSplitReady, setIsSplitReady] = useState(false);

  useEffect(() => {
    const storedValue = window.localStorage.getItem(SPLIT_PANEL_STORAGE_KEY);
    const storedWidth = storedValue == null ? null : Number(storedValue);

    if (storedWidth != null && Number.isFinite(storedWidth)) {
      setLeftPanelWidth(clampLeftPanelWidth(storedWidth));
    }

    setIsSplitReady(true);
  }, []);

  useEffect(() => {
    if (!isSplitReady) {
      return;
    }

    window.localStorage.setItem(
      SPLIT_PANEL_STORAGE_KEY,
      String(leftPanelWidth),
    );
  }, [isSplitReady, leftPanelWidth]);

  function updateSplitFromClientX(clientX: number) {
    const container = splitContainerRef.current;
    if (!container) {
      return;
    }

    const { left, width } = container.getBoundingClientRect();
    if (width === 0) {
      return;
    }

    setLeftPanelWidth(clampLeftPanelWidth(((clientX - left) / width) * 100));
  }

  const splitLayoutStyle = {
    "--tests-split-left-panel-width": `${leftPanelWidth}%`,
  } as CSSProperties;

  return (
    <>
      <div
        className="grid min-h-0 flex-1 grid-cols-1 grid-rows-[minmax(0,1fr)_minmax(0,1fr)] divide-y divide-border sm:grid-cols-[var(--tests-split-left-panel-width)_0.75rem_minmax(0,1fr)] sm:grid-rows-[minmax(0,1fr)] sm:divide-y-0"
        ref={splitContainerRef}
        style={splitLayoutStyle}
      >
        <div className="flex min-h-0 flex-col gap-4 overflow-y-auto p-4">
          {left}
        </div>
        <div
          aria-label="Resize question and answer panels"
          aria-orientation="vertical"
          aria-valuemax={MAX_LEFT_PANEL_WIDTH}
          aria-valuemin={MIN_LEFT_PANEL_WIDTH}
          aria-valuenow={Math.round(leftPanelWidth)}
          className="relative hidden cursor-col-resize touch-none select-none sm:block before:absolute before:inset-y-0 before:left-1/2 before:w-px before:-translate-x-1/2 before:bg-border hover:before:bg-foreground focus:outline-none focus:before:bg-foreground"
          onKeyDown={(event) => {
            if (event.key === "ArrowLeft") {
              event.preventDefault();
              setLeftPanelWidth((width) => clampLeftPanelWidth(width - 2));
            }

            if (event.key === "ArrowRight") {
              event.preventDefault();
              setLeftPanelWidth((width) => clampLeftPanelWidth(width + 2));
            }
          }}
          onPointerDown={(event) => {
            if (event.pointerType === "mouse" && event.button !== 0) {
              return;
            }

            event.currentTarget.setPointerCapture(event.pointerId);
            updateSplitFromClientX(event.clientX);
          }}
          onPointerMove={(event) => {
            if (event.currentTarget.hasPointerCapture(event.pointerId)) {
              updateSplitFromClientX(event.clientX);
            }
          }}
          onPointerUp={(event) => {
            if (event.currentTarget.hasPointerCapture(event.pointerId)) {
              event.currentTarget.releasePointerCapture(event.pointerId);
            }
          }}
          role="separator"
          tabIndex={0}
        />
        <div className="flex min-h-0 flex-col gap-4 overflow-y-auto p-4">
          {right}
        </div>
      </div>
      {navigation != null ? (
        <div className="shrink-0 border-t border-border p-4">{navigation}</div>
      ) : null}
    </>
  );
}
