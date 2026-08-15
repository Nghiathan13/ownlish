"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { CollectionSummary } from "@/entities/collection";
import type { ProgressSource } from "../model/types";
import {
  useReviewProgress,
  type ProgressFilterOption,
} from "../model/useReviewProgress";
import { ReviewProgressDonut } from "./ReviewProgressDonut";
import { ReviewProgressLevels } from "./ReviewProgressLevels";
import { classNames } from "@/shared/lib/classNames";
import { useT } from "@/shared/lib/providers";
import { BarChartIcon } from "@/shared/ui/icons";
import { CheckIcon } from "@/shared/ui/icons";
import { DonutChartIcon } from "@/shared/ui/icons";
import { FilterIcon } from "@/shared/ui/icons";
import { Tooltip } from "@/shared/ui/Tooltip";
import { iconButtonGroupClassName } from "@/shared/ui/Tooltip";

type ProgressView = "summary" | "levels";

type ReviewProgressCardProps = {
  collections: CollectionSummary[];
  isAuthenticated: boolean;
  source: ProgressSource;
  userId: string | null;
};

export function ReviewProgressCard({
  collections,
  isAuthenticated,
  source,
  userId,
}: ReviewProgressCardProps) {
  const t = useT();
  const [view, setView] = useState<ProgressView>("summary");
  const {
    activeBandIds,
    activeCollectionIds,
    bandOptions,
    collectionOptions,
    error,
    isLoading,
    progress,
    toggleBand,
    toggleCollection,
  } = useReviewProgress({
    collections,
    isAuthenticated,
    source,
    userId,
  });

  return (
    <article className="flex h-full min-h-[328px] min-w-[250px] w-full flex-col rounded-2xl border border-border bg-surface-card pt-3 pr-3 pb-4 pl-4 lg:min-h-0">
      <div className="flex shrink-0 items-center gap-3">
        <h2 className="min-w-0 flex-1 truncate text-base font-semibold leading-6 text-foreground">
          {t("dashboard.collectionProgress")}
        </h2>
        <div className="ml-auto flex shrink-0 items-center gap-2">
          <ProgressViewButton
            onClick={() =>
              setView((currentView) =>
                currentView === "summary" ? "levels" : "summary",
              )
            }
            view={view}
          />
          {source === "collection" ? (
            <ProgressFilterDropdown
              ariaLabel={t("dashboard.filterCollections")}
              onToggle={toggleCollection}
              options={collectionOptions}
              selectedIds={activeCollectionIds}
              tooltip={t("dashboard.filterCollections")}
            />
          ) : (
            <ProgressFilterDropdown
              ariaLabel={t("dashboard.filterBands")}
              onToggle={toggleBand}
              options={bandOptions}
              selectedIds={activeBandIds}
              tooltip={t("dashboard.filterBands")}
            />
          )}
        </div>
      </div>
      {error ? (
        <p className="mt-4 text-sm text-muted-foreground">{error}</p>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col">
          {isLoading ? (
            <div className="mt-4 min-h-0 flex-1 animate-pulse rounded-xl bg-muted-background" />
          ) : view === "levels" ? (
            <ReviewProgressLevels progress={progress} />
          ) : (
            <ReviewProgressDonut progress={progress} />
          )}
        </div>
      )}
    </article>
  );
}

function ProgressFilterDropdown({
  ariaLabel,
  onToggle,
  options,
  selectedIds,
  tooltip,
}: {
  ariaLabel: string;
  onToggle: (id: string) => void;
  options: ProgressFilterOption[];
  selectedIds: string[];
  tooltip: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div className="relative shrink-0" ref={rootRef}>
      <button
        aria-controls={menuId}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label={ariaLabel}
        className={classNames(
          "relative inline-flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-md border border-border text-foreground before:pointer-events-none before:absolute before:inset-0 before:rounded-md hover:before:bg-hover-overlay",
          iconButtonGroupClassName,
        )}
        onClick={() => setIsOpen((current) => !current)}
        type="button"
      >
        <FilterIcon className="size-5" />
        {!isOpen ? (
          <Tooltip group="icon-button" placement="bottom">
            {tooltip}
          </Tooltip>
        ) : null}
      </button>

      {isOpen ? (
        <div
          aria-label={ariaLabel}
          className="absolute top-[calc(100%+0.5rem)] right-0 z-20 min-w-[160px] rounded-lg border border-border bg-surface-card p-1"
          id={menuId}
          role="menu"
        >
          {options.length === 0 ? (
            <p className="px-2 py-1.5 text-sm text-muted-foreground">—</p>
          ) : (
            options.map((option) => {
              const isSelected = selectedIds.includes(option.id);

              return (
                <button
                  aria-checked={isSelected}
                  className="flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-hover-overlay"
                  key={option.id}
                  onClick={() => onToggle(option.id)}
                  role="menuitemcheckbox"
                  type="button"
                >
                  <span className="inline-flex size-4 shrink-0 items-center justify-center">
                    {isSelected ? <CheckIcon className="size-4" /> : null}
                  </span>
                  <span className="truncate">{option.label}</span>
                </button>
              );
            })
          )}
        </div>
      ) : null}
    </div>
  );
}

function ProgressViewButton({
  onClick,
  view,
}: {
  onClick: () => void;
  view: ProgressView;
}) {
  const t = useT();
  // Icon shows the target view; tooltip describes the action (like theme toggle).
  const switchesToSummary = view === "levels";
  const tooltip = switchesToSummary
    ? t("dashboard.switchToSummaryChart")
    : t("dashboard.switchToLevelsChart");

  return (
    <button
      aria-label={tooltip}
      className={classNames(
        "relative inline-flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-md border border-border text-foreground before:pointer-events-none before:absolute before:inset-0 before:rounded-md hover:before:bg-hover-overlay",
        iconButtonGroupClassName,
      )}
      onClick={onClick}
      type="button"
    >
      {switchesToSummary ? (
        <DonutChartIcon className="size-5" />
      ) : (
        <BarChartIcon className="size-5" />
      )}
      <Tooltip group="icon-button" placement="bottom">
        {tooltip}
      </Tooltip>
    </button>
  );
}
