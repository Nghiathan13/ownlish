import { classNames } from "@/shared/lib/classNames";
import { secondaryTextButtonClassName } from "@/shared/ui/button";
import { statusColorClasses } from "@/shared/ui/theme/statusColors";

type PracticeSubmissionAlertProps = {
  isSubmitting: boolean;
  onRetry: () => void;
};

export function PracticeSubmissionAlert({
  isSubmitting,
  onRetry,
}: PracticeSubmissionAlertProps) {
  return (
    <div
      aria-busy={isSubmitting}
      className={classNames(
        "flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3",
        statusColorClasses.danger.border,
        statusColorClasses.danger.background,
        statusColorClasses.danger.text,
      )}
      role="alert"
    >
      <p>
        Some answers could not be saved. Please retry before leaving this group.
      </p>
      <button
        aria-busy={isSubmitting}
        className={secondaryTextButtonClassName(
          statusColorClasses.danger.border,
          statusColorClasses.danger.text,
          statusColorClasses.danger.backgroundHover,
        )}
        disabled={isSubmitting}
        onClick={onRetry}
        type="button"
      >
        Retry saving answers
      </button>
    </div>
  );
}
