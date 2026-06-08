import type { VocabWord } from "@/entities/vocab/api/vocab";
import { Button } from "@/shared/ui/Button";

type DeleteWordConfirmProps = {
  isDeleting: boolean;
  onCancel: () => void;
  onConfirm: (word: VocabWord) => void;
  word: VocabWord;
};

export function DeleteWordConfirm({
  isDeleting,
  onCancel,
  onConfirm,
  word,
}: DeleteWordConfirmProps) {
  return (
    <div className="mt-6 grid gap-4 rounded-xl border border-border p-4">
      <div>
        <h2 className="text-lg font-semibold">Delete word</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Delete <span className="font-semibold text-foreground">{word.word}</span>{" "}
          from your vocabulary?
        </p>
      </div>

      <div className="flex gap-3">
        <Button
          type="button"
          disabled={isDeleting}
          onClick={() => onConfirm(word)}
        >
          {isDeleting ? "Deleting..." : "Delete"}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
