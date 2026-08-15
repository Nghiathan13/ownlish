type DictionaryTermsProps = {
  items: string[];
  label: string;
};

export function DictionaryTerms({ items, label }: DictionaryTermsProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <p className="text-sm text-muted-foreground">
      <span className="font-medium text-foreground">{label}: </span>
      {items.join(", ")}
    </p>
  );
}
