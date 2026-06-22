import { secondaryTextButtonClassName } from "@/shared/ui/button";

type CollectionsRetryPanelProps = {
  message: string;
  onRetry: () => void;
};

export function CollectionsRetryPanel({
  message,
  onRetry,
}: CollectionsRetryPanelProps) {
  return (
    <div className="grid gap-4 rounded-xl border border-border p-4">
      <p className="text-sm text-muted-foreground">{message}</p>
      <button
        className={secondaryTextButtonClassName("w-fit")}
        onClick={() => {
          void onRetry();
        }}
        type="button"
      >
        Retry
      </button>
    </div>
  );
}
