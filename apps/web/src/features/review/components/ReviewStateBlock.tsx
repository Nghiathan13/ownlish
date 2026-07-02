import { ReviewCardSkeleton } from "@/features/review/components/ReviewCardSkeleton";
import { secondaryTextButtonClassName } from "@/shared/ui/button";

type ReviewStateBlockProps = {
  error: string | null;
  isEmpty: boolean;
  isLoading: boolean;
  onRetry: () => void;
};

export function ReviewStateBlock({
  error,
  isEmpty,
  isLoading,
  onRetry,
}: ReviewStateBlockProps) {
  if (isLoading) {
    return <ReviewCardSkeleton />;
  }

  if (error) {
    return (
      <div className="grid min-h-[28rem] place-items-center rounded-[2rem] border border-border bg-background p-6 text-center">
        <div className="max-w-md">
          <p className="text-sm font-semibold text-danger">Review could not load</p>
          <h2 className="mt-3 text-3xl font-black tracking-tight">
            Try this deck again.
          </h2>
          <p className="mt-3 leading-7 text-muted-foreground">{error}</p>
          <button
            type="button"
            className={secondaryTextButtonClassName("mt-6 w-fit")}
            onClick={onRetry}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className="grid min-h-[28rem] place-items-center rounded-[2rem] border border-border bg-background p-6 text-center">
        <div className="max-w-lg">
          <p className="text-sm font-semibold text-muted-foreground">Queue clear</p>
          <h2 className="mt-3 text-4xl font-black tracking-tight">
            No words to review today.
          </h2>
          <p className="mt-4 leading-7 text-muted-foreground">
            Your due list is empty. Add more words or come back when the next cards are ready.
          </p>
        </div>
      </div>
    );
  }

  return null;
}
