"use client";

import { ContextEvidenceText } from "@/features/tests/run/components/ContextEvidenceText";
import { PracticeTranslationCard } from "@/features/tests/run/components/PracticeTranslationCard";
import { useEvidenceHighlightPreference } from "@/features/tests/run/hooks/useEvidenceHighlightPreference";
import { hasContextEvidenceMarkers, stripContextEvidenceMarkup } from "@/features/tests/run/lib/parseContextEvidence";
import { classNames } from "@/shared/lib/classNames";

type PassagePanelProps = {
  content: string | null;
  contentVi?: string | null;
  showRawContentWhenEvidenceOff?: boolean;
  showTranslation: boolean;
  title?: string;
  showEvidenceToggle?: boolean;
};

type EvidenceHighlightSwitchProps = {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
};

function EvidenceHighlightSwitch({
  checked,
  onCheckedChange,
}: EvidenceHighlightSwitchProps) {
  return (
    <button
      aria-checked={checked}
      aria-label="Highlight evidence"
      className={classNames(
        "relative h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors duration-100 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        checked ? "bg-foreground" : "bg-neutral-300 dark:bg-neutral-600",
      )}
      onClick={() => {
        onCheckedChange(!checked);
      }}
      role="switch"
      type="button"
    >
      <span
        className={classNames(
          "absolute top-1/2 size-4 -translate-y-1/2 rounded-full bg-background shadow-sm transition-[left] duration-100 ease-in-out",
          checked ? "left-[calc(100%-1.125rem)]" : "left-0.5",
        )}
      />
    </button>
  );
}

export function PassagePanel({
  content,
  contentVi,
  showRawContentWhenEvidenceOff = false,
  showTranslation,
  title = "Passage",
  showEvidenceToggle = false,
}: PassagePanelProps) {
  const hasContent = Boolean(content?.trim());
  const hasTranslation = Boolean(showTranslation && contentVi?.trim());
  const canToggleEvidence =
    showEvidenceToggle && hasContent && hasContextEvidenceMarkers(content);
  const { enabled: isEvidenceHighlighted, setEnabled: setIsEvidenceHighlighted } =
    useEvidenceHighlightPreference();

  const shouldHighlightEvidence =
    canToggleEvidence && isEvidenceHighlighted;

  if (!hasContent && !hasTranslation) {
    return null;
  }

  return (
    <div className="flex flex-col gap-4">
      {hasContent ? (
        <PracticeTranslationCard
          headerAction={
            canToggleEvidence ? (
              <EvidenceHighlightSwitch
                checked={isEvidenceHighlighted}
                onCheckedChange={setIsEvidenceHighlighted}
              />
            ) : undefined
          }
          title={title}
        >
          <div className="whitespace-pre-wrap text-base">
            {shouldHighlightEvidence ? (
              <ContextEvidenceText content={content!} />
            ) : canToggleEvidence ? (
              showRawContentWhenEvidenceOff
                ? content
                : stripContextEvidenceMarkup(content!)
            ) : (
              content
            )}
          </div>
        </PracticeTranslationCard>
      ) : null}
      {hasTranslation ? (
        <PracticeTranslationCard title={hasContent ? "Translation" : title}>
          <div className="whitespace-pre-wrap text-base">
            {contentVi}
          </div>
        </PracticeTranslationCard>
      ) : null}
    </div>
  );
}
