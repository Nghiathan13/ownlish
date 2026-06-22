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
    return <p className="text-muted-foreground">Loading review queue...</p>;
  }

  if (error) {
    return (
      <div className="grid gap-4">
        <p className="text-sm text-danger">{error}</p>
        <button
          type="button"
          className={secondaryTextButtonClassName("w-fit")}
          onClick={onRetry}
        >
          Retry
        </button>
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div>
        <h2 className="mb-2 text-xl font-semibold">No words to review today.</h2>
        <p className="text-muted-foreground">
          Add more words or come back when your vocabulary is due.
        </p>
      </div>
    );
  }

  return null;
}
