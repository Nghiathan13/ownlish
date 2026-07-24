"use client";

import { useT } from "@/shared/providers/LocaleProvider";
import { secondaryTextButtonClassName } from "@/shared/ui/button";

type TableBodyStateProps = {
  columnCount: number;
  emptyDescription: string;
  emptyTitle: string;
  error?: string | null;
  isEmpty?: boolean;
  isLoading?: boolean;
  loadingMessage?: string;
  onRetry?: () => void;
};

export function TableBodyState({
  columnCount,
  emptyDescription,
  emptyTitle,
  error = null,
  isEmpty = false,
  isLoading = false,
  loadingMessage,
  onRetry,
}: TableBodyStateProps) {
  const t = useT();
  const resolvedLoadingMessage = loadingMessage ?? t("wordsTable.loadingWords");

  if (isLoading) {
    return (
      <tr>
        <td
          className="p-6 text-sm text-muted-foreground"
          colSpan={columnCount}
        >
          {resolvedLoadingMessage}
        </td>
      </tr>
    );
  }

  if (error) {
    return (
      <tr>
        <td className="p-6" colSpan={columnCount}>
          <div className="grid gap-4">
            <p className="text-sm text-danger">{error}</p>
            {onRetry ? (
              <button
                className={secondaryTextButtonClassName("w-fit")}
                onClick={onRetry}
                type="button"
              >
                {t("collections.retry")}
              </button>
            ) : null}
          </div>
        </td>
      </tr>
    );
  }

  if (isEmpty) {
    return (
      <tr>
        <td className="p-6" colSpan={columnCount}>
          <h2 className="mb-2 text-xl font-semibold">{emptyTitle}</h2>
          <p className="text-muted-foreground">{emptyDescription}</p>
        </td>
      </tr>
    );
  }

  return null;
}

export function TableMobileState({
  emptyDescription,
  emptyTitle,
  error = null,
  isEmpty = false,
  isLoading = false,
  loadingMessage,
  onRetry,
}: Omit<TableBodyStateProps, "columnCount">) {
  const t = useT();
  const resolvedLoadingMessage = loadingMessage ?? t("wordsTable.loadingWords");

  if (isLoading) {
    return (
      <p className="col-span-full rounded-lg border border-border p-6 text-sm text-muted-foreground">
        {resolvedLoadingMessage}
      </p>
    );
  }

  if (error) {
    return (
      <div className="col-span-full grid gap-4 rounded-lg border border-border p-6">
        <p className="text-sm text-danger">{error}</p>
        {onRetry ? (
          <button
            className={secondaryTextButtonClassName("w-fit")}
            onClick={onRetry}
            type="button"
          >
            {t("collections.retry")}
          </button>
        ) : null}
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className="col-span-full rounded-lg border border-border p-6">
        <h2 className="mb-2 text-xl font-semibold">{emptyTitle}</h2>
        <p className="text-muted-foreground">{emptyDescription}</p>
      </div>
    );
  }

  return null;
}
