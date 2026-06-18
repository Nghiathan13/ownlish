"use client";

import { useState } from "react";
import { ContextEvidenceText } from "@/features/tests/components/ContextEvidenceText";
import { hasContextEvidenceMarkers, stripContextEvidenceMarkup } from "@/features/tests/lib/parseContextEvidence";
import { classNames } from "@/shared/lib/classNames";

type PassagePanelProps = {
  content: string | null;
  contentVi?: string | null;
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
        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent p-0.5 transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        checked
          ? "bg-amber-500 dark:bg-amber-600"
          : "bg-muted-foreground/25 dark:bg-muted-foreground/35",
      )}
      onClick={() => {
        onCheckedChange(!checked);
      }}
      role="switch"
      type="button"
    >
      <span
        className={classNames(
          "pointer-events-none inline-block size-5 rounded-full bg-background shadow-sm transition duration-200 ease-in-out",
          checked ? "translate-x-5" : "translate-x-0",
        )}
      />
    </button>
  );
}

export function PassagePanel({
  content,
  contentVi,
  showTranslation,
  title = "Passage",
  showEvidenceToggle = false,
}: PassagePanelProps) {
  const hasContent = Boolean(content?.trim());
  const hasTranslation = Boolean(showTranslation && contentVi?.trim());
  const canToggleEvidence =
    showEvidenceToggle && hasContent && hasContextEvidenceMarkers(content);
  const [isEvidenceHighlighted, setIsEvidenceHighlighted] = useState(true);

  const shouldHighlightEvidence =
    canToggleEvidence && isEvidenceHighlighted;

  if (!hasContent && !hasTranslation) {
    return null;
  }

  return (
    <div className="flex flex-col gap-4">
      {hasContent ? (
        <>
          <div className="flex items-center gap-4">
            <h3 className="text-base font-semibold">{title}</h3>
            {canToggleEvidence ? (
              <EvidenceHighlightSwitch
                checked={isEvidenceHighlighted}
                onCheckedChange={setIsEvidenceHighlighted}
              />
            ) : null}
          </div>
          <div className="whitespace-pre-wrap text-base leading-relaxed select-text">
            {shouldHighlightEvidence ? (
              <ContextEvidenceText content={content!} />
            ) : canToggleEvidence ? (
              stripContextEvidenceMarkup(content!)
            ) : (
              content
            )}
          </div>
        </>
      ) : null}
      {hasTranslation ? (
        <div className="rounded-lg border border-border bg-muted/40 p-3">
          {hasContent ? (
            <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Vietnamese
            </p>
          ) : (
            <h3 className="mb-2 text-base font-semibold">{title}</h3>
          )}
          <div className="whitespace-pre-wrap text-base leading-relaxed text-muted-foreground select-text">
            {contentVi}
          </div>
        </div>
      ) : null}
    </div>
  );
}
