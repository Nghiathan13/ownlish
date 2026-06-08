import { Button } from "@/shared/ui/Button";

type VocabularyPaginationProps = {
  canGoNext: boolean;
  canGoPrevious: boolean;
  itemCount: number;
  offset: number;
  onNext: () => void;
  onPrevious: () => void;
  total: number;
};

export function VocabularyPagination({
  canGoNext,
  canGoPrevious,
  itemCount,
  offset,
  onNext,
  onPrevious,
  total,
}: VocabularyPaginationProps) {
  if (total === 0) {
    return null;
  }

  const start = offset + 1;
  const end = offset + itemCount;

  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-muted-foreground">
        {start}-{end} of {total}
      </p>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="secondary"
          disabled={!canGoPrevious}
          onClick={onPrevious}
        >
          Previous
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={!canGoNext}
          onClick={onNext}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
