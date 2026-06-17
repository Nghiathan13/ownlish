import { classNames } from "@/shared/lib/classNames";
import { ArrowBackIcon } from "@/shared/ui/icons/ArrowBackIcon";
import { ArrowForwardIcon } from "@/shared/ui/icons/ArrowForwardIcon";

type PracticeNavigationButtonsProps = {
  nextAriaLabel?: string;
  nextDisabled?: boolean;
  onNext: () => void;
  onPrevious: () => void;
  previousDisabled?: boolean;
};

export function PracticeNavigationButtons({
  nextAriaLabel = "Next",
  nextDisabled = false,
  onNext,
  onPrevious,
  previousDisabled = false,
}: PracticeNavigationButtonsProps) {
  return (
    <div className="flex items-center justify-end gap-2">
      <button
        aria-label="Previous"
        className={classNames(
          "inline-flex size-8 items-center justify-center rounded-md border border-border bg-transparent text-foreground transition-colors duration-200",
          previousDisabled
            ? "cursor-not-allowed opacity-50"
            : "cursor-pointer hover:border-foreground",
        )}
        disabled={previousDisabled}
        onClick={onPrevious}
        type="button"
      >
        <ArrowBackIcon className="size-4" />
      </button>
      <button
        aria-label={nextAriaLabel}
        className={classNames(
          "inline-flex size-8 items-center justify-center rounded-md border border-border bg-transparent text-foreground transition-colors duration-200",
          nextDisabled
            ? "cursor-not-allowed opacity-50"
            : "cursor-pointer hover:border-foreground",
        )}
        disabled={nextDisabled}
        onClick={onNext}
        type="button"
      >
        <ArrowForwardIcon className="size-4" />
      </button>
    </div>
  );
}
