import type {
  VocabWord,
  VocabWordDefinition,
} from "@/entities/vocab/api/vocab";
import { Button } from "@/shared/ui/Button";

type DeleteDefinitionConfirmProps = {
  definition: VocabWordDefinition;
  isDeleting: boolean;
  onCancel: () => void;
  onConfirm: (word: VocabWord, definition: VocabWordDefinition) => void;
  word: VocabWord;
};

function getDefinitionLabel(definition: VocabWordDefinition) {
  const meaning = definition.meaningVi || definition.definition;

  if (definition.type && meaning) {
    return `${definition.type} — ${meaning}`;
  }

  return definition.type || meaning || "this definition";
}

export function DeleteDefinitionConfirm({
  definition,
  isDeleting,
  onCancel,
  onConfirm,
  word,
}: DeleteDefinitionConfirmProps) {
  return (
    <div className="grid gap-4">
      <p className="text-sm text-muted-foreground">
        Delete{" "}
        <span className="font-semibold text-foreground">{word.word}</span>{" "}
        ({getDefinitionLabel(definition)}) from your vocabulary?
      </p>

      <div className="flex gap-3">
        <Button
          type="button"
          disabled={isDeleting}
          onClick={() => onConfirm(word, definition)}
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
