import { TextInput } from "@/shared/ui/TextInput";

type VocabularySearchProps = {
  onSearchChange: (search: string) => void;
  search: string;
};

export function VocabularySearch({
  onSearchChange,
  search,
}: VocabularySearchProps) {
  return (
    <div className="mt-8 grid gap-2">
      <label
        htmlFor="vocabulary-search"
        className="text-sm font-semibold text-foreground"
      >
        Search
      </label>
      <TextInput
        id="vocabulary-search"
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder="Search by word"
      />
    </div>
  );
}
