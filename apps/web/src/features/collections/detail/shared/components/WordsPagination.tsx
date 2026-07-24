"use client";

import type { ReactNode } from "react";
import {
  VOCABULARY_PAGE_SIZE_OPTIONS,
  isVocabularyPageSize,
  type VocabularyPageSize,
} from "@/entities/vocab/lib/vocabPagination";
import { formatMessage } from "@/shared/i18n/messages";
import { classNames } from "@/shared/lib/classNames";
import { useT } from "@/shared/providers/LocaleProvider";
import { iconOnlyButtonClassName } from "@/shared/ui/button";
import { ArrowBackIcon } from "@/shared/ui/icons/ArrowBackIcon";
import { ArrowForwardIcon } from "@/shared/ui/icons/ArrowForwardIcon";

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

      <div className="flex flex-wrap items-center gap-1 text-base text-muted-foreground">
        <select
          aria-label={t("wordsTable.wordsPerPage")}
          className="page-size-select h-8 w-fit min-w-0 cursor-pointer appearance-none rounded-md border border-border bg-transparent px-2.5 text-base text-foreground outline-none [field-sizing:content] hover:border-foreground"
          value={pageSize}
          onChange={(event) => {
            const value = Number(event.target.value);

            if (isVocabularyPageSize(value)) {
              onPageSizeChange(value);
            }
          }}
        >
          {VOCABULARY_PAGE_SIZE_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {formatMessage(t("wordsTable.wordsOption"), { count: option })}
            </option>
          ))}
        </select>
        <span>
          {formatMessage(t("wordsTable.ofTotal"), { total })}
        </span>
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
      className={iconOnlyButtonClassName(
        "border border-border bg-transparent text-foreground enabled:hover:border-foreground",
      )}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
