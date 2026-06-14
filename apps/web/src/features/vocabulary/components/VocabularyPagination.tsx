import type { ReactNode } from "react";
import { ArrowBackIcon } from "@/shared/ui/icons/ArrowBackIcon";
import { ArrowForwardIcon } from "@/shared/ui/icons/ArrowForwardIcon";
import { classNames } from "@/shared/lib/classNames";

type VocabularyPaginationProps = {
  canGoNext: boolean;
  canGoPrevious: boolean;
  itemCount: number;
  offset: number;
  onNext: () => void;
  onPrevious: () => void;
  pageSize: number;
  total: number;
};

export function VocabularyPagination({
  canGoNext,
  canGoPrevious,
  itemCount,
  offset,
  onNext,
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

      <p className="text-sm text-muted-foreground">
        {itemCount} words
      </p>
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
