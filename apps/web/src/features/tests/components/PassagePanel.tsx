type PassagePanelProps = {
  content: string | null;
  contentVi?: string | null;
  showTranslation: boolean;
  title?: string;
};

export function PassagePanel({
  content,
  contentVi,
  showTranslation,
  title = "Passage",
}: PassagePanelProps) {
  const hasContent = Boolean(content?.trim());
  const hasTranslation = Boolean(showTranslation && contentVi?.trim());

  if (!hasContent && !hasTranslation) {
    return null;
  }

  return (
    <div className="flex flex-col gap-4">
      {hasContent ? (
        <>
          <h3 className="text-base font-semibold">{title}</h3>
          <div className="whitespace-pre-wrap text-base leading-relaxed select-text">
            {content}
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
