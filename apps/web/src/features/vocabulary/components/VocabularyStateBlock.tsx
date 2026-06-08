import { Button } from "@/shared/ui/Button";

type VocabularyStateBlockProps = {
  isLoading: boolean;
  error: string | null;
  isEmpty: boolean;
};

export function VocabularyStateBlock({
  error,
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
        <h2 className="mb-2 text-xl font-semibold">No vocabulary yet.</h2>
        <p className="text-muted-foreground">
          Add word support comes next. This page is now connected to the
          backend.
        </p>
      </div>
    );
  }

  return null;
}
