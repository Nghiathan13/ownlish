export function CollectionNotFoundState() {
  return (
    <div className="mx-16 rounded-xl border border-border p-6">
      <h1 className="mb-2 text-xl font-semibold">Collection not found.</h1>
      <p className="text-muted-foreground">
        Go back to collections and choose an available set.
      </p>
    </div>
  );
}
