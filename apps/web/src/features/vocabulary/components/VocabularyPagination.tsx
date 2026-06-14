import type { ReactNode } from "react";
import {
  VOCABULARY_PAGE_SIZE_OPTIONS,
  isVocabularyPageSize,
  type VocabularyPageSize,
} from "@/entities/vocab/lib/vocabPagination";
import { classNames } from "@/shared/lib/classNames";
import { ArrowBackIcon } from "@/shared/ui/icons/ArrowBackIcon";
import { ArrowForwardIcon } from "@/shared/ui/icons/ArrowForwardIcon";

type VocabularyPaginationProps = {
  canGoNext: boolean;
  canGoPrevious: boolean;
  itemCount: number;
  offset: number;
  onNext: () => void;
  onPageSizeChange: (pageSize: VocabularyPageSize) => void;
  onPrevious: () => void;
  pageSize: VocabularyPageSize;
  total: number;
};

export function VocabularyPagination({
  canGoNext,
  canGoPrevious,
  itemCount,
  offset,
  onNext,
  onPageSizeChange,
  onPrevious,
  pageSize,
  total,
}: VocabularyPaginationProps) {
  if (total === 0) {
    return null;
  }

  const currentPage = Math.floor(offset / pageSize) + 1;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="flex flex-wrap items-center gap-3">
      <PaginationIconButton
        disabled={!canGoPrevious}
        label="Previous page"
        onClick={onPrevious}
      >
        <ArrowBackIcon className="size-3.5" />
      </PaginationIconButton>

      <p className="text-sm text-muted-foreground">
        Page {currentPage} of {totalPages}
      </p>

      <PaginationIconButton
        disabled={!canGoNext}
        label="Next page"
        onClick={onNext}
      >
        <ArrowForwardIcon className="size-3.5" />
      </PaginationIconButton>

      <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
        <label className="flex items-center gap-2">
          <select
            aria-label="Words per page"
            className="rounded-md border border-border bg-muted px-2 py-1 text-foreground"
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
                {option}
              </option>
            ))}
          </select>
          <span>words</span>
        </label>
        <span>
          {itemCount} words of {total} words
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
      className={classNames(
        "inline-flex size-7 items-center justify-center rounded-md border border-border bg-muted text-foreground transition-colors duration-200",
        disabled
          ? "cursor-not-allowed opacity-50"
          : "cursor-pointer hover:border-foreground",
      )}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
