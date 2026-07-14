import { primaryTextButtonClassName } from "@/shared/ui/button";
import { Modal } from "@/shared/ui/Modal";

type MockFinishFailureModalProps = {
  error: string;
  isRetrying: boolean;
  onClose: () => void;
  onRetry: () => void;
};

export function MockFinishFailureModal({
  error,
  isRetrying,
  onClose,
  onRetry,
}: MockFinishFailureModalProps) {
  return (
    <Modal onClose={onClose} title="Could not finish mock test">
      <div className="grid gap-4">
        <p className="text-muted-foreground">{error}</p>
        <p>
          Changes made after Finish stay only on this screen and will not change
          the submitted result.
        </p>
        <div>
          <button
            aria-busy={isRetrying}
            className={primaryTextButtonClassName()}
            disabled={isRetrying}
            onClick={onRetry}
            type="button"
          >
            {isRetrying ? "Retrying..." : "Retry Finish"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
