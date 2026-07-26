"use client";

import type { ReactNode } from "react";
import {
  VOCABULARY_PAGE_SIZE_OPTIONS,
  type VocabularyPageSize,
} from "@/entities/vocab/lib/vocabPagination";
import { formatMessage } from "@/shared/i18n/messages";
import { classNames } from "@/shared/lib/classNames";
import { useT } from "@/shared/providers/LocaleProvider";
import { iconOnlyButtonClassName } from "@/shared/ui/button";
import { ArrowBackIcon } from "@/shared/ui/icons/ArrowBackIcon";
import { ArrowForwardIcon } from "@/shared/ui/icons/ArrowForwardIcon";
import { SelectDropdown } from "@/shared/ui/SelectDropdown";

const paginationSurfaceButtonClassName = iconOnlyButtonClassName(
  "border border-border bg-surface text-foreground enabled:hover:[box-shadow:inset_0_0_0_9999px_var(--hover-overlay)] dark:bg-[#000000]",
);

type WordsPaginationProps = {
  canGoNext: boolean;
  canGoPrevious: boolean;
  className?: string;
  offset: number;
  onNext: () => void;
  onPageSizeChange: (pageSize: VocabularyPageSize) => void;
  onPrevious: () => void;
  pageSize: VocabularyPageSize;
  total: number;
};

export function WordsPagination({
  canGoNext,
  canGoPrevious,
  className,
  offset,
  onNext,
  onPageSizeChange,
  onPrevious,
  pageSize,
  total,
}: WordsPaginationProps) {
  const t = useT();

  if (total === 0) {
    return null;
  }

  const currentPage = Math.floor(offset / pageSize) + 1;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const pageSizeOptions = VOCABULARY_PAGE_SIZE_OPTIONS.map((option) => ({
    label: formatMessage(t("wordsTable.wordsOption"), { count: option }),
    value: option,
  }));

  return (
    <div className={classNames("flex flex-wrap items-center gap-2", className)}>
      <PaginationIconButton
        disabled={!canGoPrevious}
        label={t("wordsTable.previousPage")}
        onClick={onPrevious}
      >
        <ArrowBackIcon />
      </PaginationIconButton>

      <p className="text-base text-muted-foreground">
        {formatMessage(t("wordsTable.pageOf"), {
          current: currentPage,
          total: totalPages,
        })}
      </p>

      <PaginationIconButton
        disabled={!canGoNext}
        label={t("wordsTable.nextPage")}
        onClick={onNext}
      >
        <ArrowForwardIcon />
      </PaginationIconButton>

      <div className="flex flex-wrap items-center gap-2 text-base text-muted-foreground">
        <SelectDropdown
          ariaLabel={t("wordsTable.wordsPerPage")}
          className="w-fit"
          hideIcon
          menuAlign="left"
          menuOrientation="horizontal"
          menuPlacement="top"
          onChange={onPageSizeChange}
          optionClassName="h-8 rounded-md px-2.5 text-base font-normal"
          options={pageSizeOptions}
          triggerClassName="h-8 rounded-md px-2.5 text-base font-normal"
          value={pageSize}
        />
        <span>{formatMessage(t("wordsTable.ofTotal"), { total })}</span>
      </div>
    </div>
  );
}

function PaginationIconButton({
  children,
  disabled,
  label,
  onClick,
}: {
  children: ReactNode;
  disabled: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      className={paginationSurfaceButtonClassName}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
