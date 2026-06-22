import { textButtonClassName } from "@/shared/ui/button/buttonTheme";

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
          className={textButtonClassName(
            "border-foreground bg-foreground text-background",
          )}
          disabled={isDeleting}
          onClick={onConfirm}
        >
          {isDeleting ? "Deleting..." : "Delete"}
        </button>
        <button
          type="button"
          className={textButtonClassName(
            "border-border bg-transparent text-foreground hover:bg-muted",
          )}
          onClick={onCancel}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
