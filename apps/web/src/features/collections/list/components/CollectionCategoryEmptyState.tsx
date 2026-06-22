type CollectionCategoryEmptyStateProps = {
  categoryLabel: string;
};

export function CollectionCategoryEmptyState({
  categoryLabel,
}: CollectionCategoryEmptyStateProps) {
  return (
    <div className="mx-4 rounded-xl border border-border p-6">
      <h2 className="mb-2 text-xl font-semibold">
        No {categoryLabel} collections yet.
      </h2>
      <p className="text-muted-foreground">
        This category is ready for future word sets.
      </p>
    </div>
  );
}
