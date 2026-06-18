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

const evidenceToggleClassName =
  "inline-flex shrink-0 cursor-pointer items-center rounded-md border px-2.5 py-1 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

const evidenceToggleOnClassName =
  "border-amber-300/70 bg-amber-50 text-amber-900 hover:bg-amber-100/80 dark:border-amber-700/60 dark:bg-amber-950/50 dark:text-amber-200 dark:hover:bg-amber-950/70";

const evidenceToggleOffClassName =
  "border-border bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground";

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
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-base font-semibold">{title}</h3>
            {canToggleEvidence ? (
              <button
                aria-pressed={isEvidenceHighlighted}
                className={classNames(
                  evidenceToggleClassName,
                  isEvidenceHighlighted
                    ? evidenceToggleOnClassName
                    : evidenceToggleOffClassName,
                )}
                onClick={() => {
                  setIsEvidenceHighlighted((current) => !current);
                }}
                type="button"
              >
                Evidence
              </button>
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
