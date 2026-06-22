import {
  primaryTextButtonClassName,
  secondaryTextButtonClassName,
} from "@/shared/ui/button";

type DeleteDefinitionsConfirmProps = {
  count: number;
  isDeleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function DeleteDefinitionsConfirm({
  count,
  isDeleting,
  onCancel,
  onConfirm,
}: DeleteDefinitionsConfirmProps) {
  return (
    <div className="grid gap-4">
      <p className="text-sm text-muted-foreground">
        Delete{" "}
        <span className="font-semibold text-foreground">{count}</span> selected
        definition{count === 1 ? "" : "s"} from your vocabulary?
      </p>

      <div className="flex gap-3">
        <button
          type="button"
          className={primaryTextButtonClassName()}
          disabled={isDeleting}
          onClick={onConfirm}
        >
          {isDeleting ? "Deleting..." : "Delete"}
        </button>
        <button
          type="button"
          className={secondaryTextButtonClassName()}
          onClick={onCancel}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
