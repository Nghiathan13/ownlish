"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { useT } from "@/shared/providers/LocaleProvider";

const DEFAULT_TOP_PANEL_HEIGHT = 70;
const MIN_TOP_PANEL_HEIGHT = 30;
const MAX_TOP_PANEL_HEIGHT = 75;
const TOP_PANEL_BOTTOM_PADDING_PX = 76;
const DIVIDER_HEIGHT_PX = 1;
const SPLIT_PANEL_STORAGE_KEY = "engvocab:dictation-split-top-panel-height";
const DRAG_START_THRESHOLD_PX = 6;

type DictationHorizontalSplitLayoutProps = {
  bottom: ReactNode;
  isTopVisible: boolean;
  top: ReactNode;
};

type SplitDragStart = {
  clientY: number;
  topPanelHeight: number;
};

function clampTopPanelHeight(value: number, maxTopPanelHeight = MAX_TOP_PANEL_HEIGHT) {
  return Math.min(
    maxTopPanelHeight,
    Math.max(MIN_TOP_PANEL_HEIGHT, value),
  );
}

function getInitialTopPanelHeight() {
  if (typeof window === "undefined") {
    return DEFAULT_TOP_PANEL_HEIGHT;
  }

  const storedValue = window.localStorage.getItem(SPLIT_PANEL_STORAGE_KEY);
  const storedHeight = storedValue == null ? null : Number(storedValue);

  return storedHeight != null && Number.isFinite(storedHeight)
    ? clampTopPanelHeight(storedHeight)
    : DEFAULT_TOP_PANEL_HEIGHT;
}

export function DictationHorizontalSplitLayout({
  bottom,
  isTopVisible,
  top,
}: DictationHorizontalSplitLayoutProps) {
  const t = useT();
  const splitContainerRef = useRef<HTMLDivElement>(null);
  const topPanelRef = useRef<HTMLDivElement>(null);
  const topPanelWidthRef = useRef<number | null>(null);
  const dragStartRef = useRef<SplitDragStart | null>(null);
  const [topPanelHeight, setTopPanelHeight] = useState(getInitialTopPanelHeight);

  useEffect(() => {
    window.localStorage.setItem(
      SPLIT_PANEL_STORAGE_KEY,
      String(topPanelHeight),
    );
  }, [topPanelHeight]);

  const getBestTopPanelHeight = useCallback(() => {
    const container = splitContainerRef.current;
    const panel = topPanelRef.current;
    if (!container || !panel) {
      return DEFAULT_TOP_PANEL_HEIGHT;
    }

    const { height: containerHeight } = container.getBoundingClientRect();
    const { width: panelWidth } = panel.getBoundingClientRect();
    if (containerHeight === 0 || panelWidth === 0) {
      return DEFAULT_TOP_PANEL_HEIGHT;
    }

    const videoHeightAtFullWidth = (panelWidth * 9) / 16;
    const topPanelHeightAtFullWidth =
      videoHeightAtFullWidth + TOP_PANEL_BOTTOM_PADDING_PX + DIVIDER_HEIGHT_PX / 2;

    return clampTopPanelHeight(
      (topPanelHeightAtFullWidth / containerHeight) * 100,
    );
  }, []);

  useLayoutEffect(() => {
    const panel = topPanelRef.current;
    const container = splitContainerRef.current;
    if (!panel || !container || typeof ResizeObserver === "undefined") return;
    const topPanel = panel;
    const splitContainer = container;

    function fitVideoFrame() {
      const { height, width } = topPanel.getBoundingClientRect();
      const previousWidth = topPanelWidthRef.current;
      const widthChanged = previousWidth !== null && Math.abs(width - previousWidth) > 0.5;
      topPanelWidthRef.current = width;

      if (widthChanged) {
        setTopPanelHeight(getBestTopPanelHeight());
      }

      const availableHeight = Math.max(0, height - TOP_PANEL_BOTTOM_PADDING_PX);
      if (availableHeight === 0 || width === 0) return;

      topPanel.style.setProperty(
        "--dictation-video-panel-width",
        `${Math.min(width, (availableHeight * 16) / 9)}px`,
      );
    }

    const observer = new ResizeObserver(fitVideoFrame);
    observer.observe(topPanel);
    observer.observe(splitContainer);
    fitVideoFrame();

    return () => observer.disconnect();
  }, [getBestTopPanelHeight]);

  function updateSplitFromDrag(clientY: number) {
    const container = splitContainerRef.current;
    const dragStart = dragStartRef.current;
    if (!container || !dragStart) {
      return;
    }

    const { height } = container.getBoundingClientRect();
    if (height === 0) {
      return;
    }

    const movement = clientY - dragStart.clientY;
    if (Math.abs(movement) <= DRAG_START_THRESHOLD_PX) {
      return;
    }

    setTopPanelHeight(
      clampTopPanelHeight(
        dragStart.topPanelHeight + (movement / height) * 100,
      ),
    );
  }

  const splitLayoutStyle = {
    "--dictation-split-top-panel-height": `${topPanelHeight}%`,
  } as CSSProperties;

  return (
    <div
      className={
        isTopVisible
          ? "flex min-h-0 min-w-0 flex-col lg:grid lg:h-full lg:grid-rows-[calc(var(--dictation-split-top-panel-height)_-_0.5px)_1px_minmax(0,1fr)]"
          : "flex min-h-0 min-w-0 flex-col lg:h-full"
      }
      ref={splitContainerRef}
      style={splitLayoutStyle}
    >
      <div
        className={
          isTopVisible
            ? "min-h-0 min-w-0 lg:flex lg:flex-col lg:items-stretch lg:pb-[var(--dictation-video-bottom-gap)]"
            : "h-0 overflow-hidden"
        }
        ref={topPanelRef}
        style={
          {
            "--dictation-video-bottom-gap": `${TOP_PANEL_BOTTOM_PADDING_PX}px`,
          } as CSSProperties
        }
      >
        {top}
      </div>
      {isTopVisible ? (
        <div
          aria-label={t("tests.resizePanels")}
          aria-orientation="horizontal"
          className="relative mt-4 h-[1px] shrink-0 bg-border lg:mr-[var(--dictation-horizontal-divider-margin)] lg:mt-0 lg:cursor-row-resize lg:touch-none lg:select-none lg:hover:bg-primary before:hidden lg:before:absolute lg:before:inset-x-0 lg:before:-inset-y-2 lg:before:block lg:before:content-['']"
          onDoubleClick={() => {
            dragStartRef.current = null;
            setTopPanelHeight(getBestTopPanelHeight());
          }}
          onPointerDown={(event) => {
            if (event.pointerType === "mouse" && event.button !== 0) {
              return;
            }

            event.currentTarget.setPointerCapture(event.pointerId);
            dragStartRef.current = {
              clientY: event.clientY,
              topPanelHeight,
            };
          }}
          onPointerMove={(event) => {
            if (event.currentTarget.hasPointerCapture(event.pointerId)) {
              updateSplitFromDrag(event.clientY);
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
      <div
        className={
          isTopVisible
            ? "mt-4 min-h-0 min-w-0 lg:mt-0 lg:overflow-y-auto lg:pt-4"
            : "min-h-0 min-w-0 lg:flex-1 lg:overflow-y-auto"
        }
      >
        {bottom}
      </div>
    </div>
  );
}
