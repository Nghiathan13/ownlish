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
    <div className="min-w-0 flex-1 sm:max-w-md">
      <TextInput
        id="vocabulary-search"
        aria-label="Search by word"
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder="Search by word"
      />
    </div>
  );
}
