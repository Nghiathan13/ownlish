"use client";

import type { ContentEvidenceSegment } from "@/entities/toeic/api/types";
import { contentEvidenceSegmentsHaveEvidence } from "@/entities/toeic-runtime/model/transcriptEvidenceSegments";
import { PassageContent } from "@/features/tests/run/components/PassageContent";
import { PracticeTranslationCard } from "@/features/tests/run/components/PracticeTranslationCard";
import { StructuredEvidenceText } from "@/features/tests/run/components/StructuredEvidenceText";
import { useEvidenceHighlightPreference } from "@/features/tests/run/hooks/useEvidenceHighlightPreference";
import { passageContentHasEvidence } from "@/features/tests/run/lib/parsePassageContent";
import { classNames } from "@/shared/lib/classNames";
import { useT } from "@/shared/providers/LocaleProvider";

type PassagePanelProps = {
  content: string | null;
  contentVi?: string | null;
  contentSegments?: ContentEvidenceSegment[] | null;
  contentViSegments?: ContentEvidenceSegment[] | null;
  cardClassName?: string;
  showRawContentWhenEvidenceOff?: boolean;
  showTitle?: boolean;
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
  const t = useT();

  return (
    <button
      aria-checked={checked}
      aria-label={t("tests.highlightEvidence")}
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

type PassageBodyProps = {
  content: string | null;
  segments: ContentEvidenceSegment[] | null | undefined;
  highlightEvidence: boolean;
  showRawEvidenceWhenOff: boolean;
};

function PassageBody({
  content,
  segments,
  highlightEvidence,
  showRawEvidenceWhenOff,
}: PassageBodyProps) {
  if (segments && segments.length > 0) {
    return (
      <StructuredEvidenceText
        highlightEvidence={highlightEvidence}
        segments={segments}
      />
    );
  }

  if (!content) {
    return null;
  }

  return (
    <PassageContent
      content={content}
      highlightEvidence={highlightEvidence}
      showRawEvidenceWhenOff={showRawEvidenceWhenOff}
    />
  );
}

export function PassagePanel({
  content,
  contentVi,
  contentSegments = null,
  contentViSegments = null,
  cardClassName,
  showRawContentWhenEvidenceOff = false,
  showTitle = true,
  showTranslation,
  title,
  showEvidenceToggle = false,
}: PassagePanelProps) {
  const t = useT();
  const resolvedTitle = title ?? t("tests.passage");
  const hasStructuredContent = Boolean(contentSegments?.length);
  const hasStructuredTranslation = Boolean(
    showTranslation && contentViSegments?.length,
  );
  const hasContent = hasStructuredContent || Boolean(content?.trim());
  const hasTranslation =
    hasStructuredTranslation || Boolean(showTranslation && contentVi?.trim());

  const contentHasEvidence = hasStructuredContent
    ? contentEvidenceSegmentsHaveEvidence(contentSegments)
    : hasContent && content
      ? passageContentHasEvidence(content)
      : false;
  const translationHasEvidence = hasStructuredTranslation
    ? contentEvidenceSegmentsHaveEvidence(contentViSegments)
    : hasTranslation && contentVi
      ? passageContentHasEvidence(contentVi)
      : false;

  const canToggleContentEvidence = showEvidenceToggle && contentHasEvidence;
  const canToggleTranslationEvidence = translationHasEvidence;
  const { enabled: isEvidenceHighlighted, setEnabled: setIsEvidenceHighlighted } =
    useEvidenceHighlightPreference();

  const shouldHighlightContentEvidence =
    contentHasEvidence && isEvidenceHighlighted;
  const shouldHighlightTranslationEvidence =
    translationHasEvidence && isEvidenceHighlighted;

  if (!hasContent && !hasTranslation) {
    return null;
  }

  return (
    <div className="flex flex-col gap-4">
      {hasContent ? (
        <PracticeTranslationCard
          className={cardClassName}
          headerAction={
            canToggleContentEvidence ? (
              <EvidenceHighlightSwitch
                checked={isEvidenceHighlighted}
                onCheckedChange={setIsEvidenceHighlighted}
              />
            ) : undefined
          }
          showHeader={showTitle}
          title={resolvedTitle}
        >
          <PassageBody
            content={content}
            highlightEvidence={shouldHighlightContentEvidence}
            segments={contentSegments}
            showRawEvidenceWhenOff={showRawContentWhenEvidenceOff}
          />
        </PracticeTranslationCard>
      ) : null}
      {hasTranslation ? (
        <PracticeTranslationCard
          className={cardClassName}
          headerAction={
            canToggleTranslationEvidence ? (
              <EvidenceHighlightSwitch
                checked={isEvidenceHighlighted}
                onCheckedChange={setIsEvidenceHighlighted}
              />
            ) : undefined
          }
          title={hasContent ? t("tests.translation") : resolvedTitle}
        >
          <PassageBody
            content={contentVi ?? null}
            highlightEvidence={shouldHighlightTranslationEvidence}
            segments={contentViSegments}
            showRawEvidenceWhenOff={showRawContentWhenEvidenceOff}
          />
        </PracticeTranslationCard>
      ) : null}
    </div>
  );
}
