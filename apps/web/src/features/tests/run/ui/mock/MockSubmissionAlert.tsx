import { classNames } from "@/shared/lib/classNames";
import { secondaryTextButtonClassName } from "@/shared/ui/button";
import { statusColorClasses } from "@/shared/ui/theme/statusColors";

type MockSubmissionAlertProps = {
  hasSyncFailures: boolean;
  onRetry: () => void;
};

export function MockSubmissionAlert({
  hasSyncFailures,
  onRetry,
}: MockSubmissionAlertProps) {
  if (!hasSyncFailures) {
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
      <p>Some answers could not be saved.</p>
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
    </div>
  );
}
