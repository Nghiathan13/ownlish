import { secondaryTextButtonClassName } from "@/shared/ui/button";

type VocabularyStateBlockProps = {
  hasSearch: boolean;
  isLoading: boolean;
  error: string | null;
  isEmpty: boolean;
  onRetry: () => void;
};

export function VocabularyStateBlock({
  error,
  hasSearch,
  isEmpty,
  isLoading,
  onRetry,
}: VocabularyStateBlockProps) {
  if (isLoading) {
    return (
      <div className="p-6 text-sm text-muted-foreground">
        Loading vocabulary...
      </div>
    );
  }

  if (error) {
    return (
      <div className="grid gap-4 p-6">
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
      <div className="p-6">
        <h2 className="mb-2 text-xl font-semibold">
          {hasSearch ? "No matching words." : "No vocabulary yet."}
        </h2>
        <p className="text-muted-foreground">
          {hasSearch
            ? "Try a different search term."
            : "Add your first word with the form above."}
        </p>
      </div>
    );
  }

  return null;
}
