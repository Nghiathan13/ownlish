export function SessionLoadingSkeleton() {
  return (
    <div className="flex min-h-0 flex-1 items-center justify-center">
      <span
        aria-label="Loading"
        className="size-8 animate-spin rounded-full border-2 border-border border-t-foreground"
        role="status"
      />
    </div>
  );
}
