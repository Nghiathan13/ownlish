import { Button } from "@/shared/ui/Button";

type VocabularyStateBlockProps = {
  hasSearch: boolean;
  isLoading: boolean;
  error: string | null;
  isEmpty: boolean;
};

export function VocabularyStateBlock({
  error,
  hasSearch,
  isEmpty,
  isLoading,
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
        <Button
          type="button"
          variant="secondary"
          onClick={() => window.location.reload()}
          className="w-fit"
        >
          Retry
        </Button>
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
