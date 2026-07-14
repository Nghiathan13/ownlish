import { classNames } from "@/shared/lib/classNames";
import { secondaryTextButtonClassName } from "@/shared/ui/button";
import { statusColorClasses } from "@/shared/ui/theme/statusColors";

type MockSubmissionAlertProps = {
  finishError: string | null;
  hasSyncFailures: boolean;
  onRetry: () => void;
};

export function MockSubmissionAlert({
  finishError,
  hasSyncFailures,
  onRetry,
}: MockSubmissionAlertProps) {
  const message = hasSyncFailures
    ? "Some answers could not be saved."
    : finishError;

  if (!message) {
    return null;
  }

  return (
    <div
      className={classNames(
        "flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3",
        statusColorClasses.danger.border,
        statusColorClasses.danger.background,
        statusColorClasses.danger.text,
      )}
      role="alert"
    >
      <p>{message}</p>
      {hasSyncFailures ? (
        <button
          className={secondaryTextButtonClassName(
            statusColorClasses.danger.border,
            statusColorClasses.danger.text,
            statusColorClasses.danger.backgroundHover,
          )}
          onClick={onRetry}
          type="button"
        >
          Retry saving answers
        </button>
      ) : null}
    </div>
  );
}
