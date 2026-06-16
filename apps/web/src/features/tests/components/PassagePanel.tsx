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
  if (!content?.trim()) {
    return (
      <p className="text-sm text-muted-foreground">No passage available.</p>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold">{title}</h3>
      <div className="max-h-[420px] overflow-y-auto whitespace-pre-wrap text-sm leading-relaxed select-text">
        {content}
      </div>
      {showTranslation && contentVi?.trim() ? (
        <div className="rounded-lg border border-border bg-muted/40 p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Vietnamese
          </p>
          <div className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground select-text">
            {contentVi}
          </div>
        </div>
      ) : null}
    </div>
  );
}
