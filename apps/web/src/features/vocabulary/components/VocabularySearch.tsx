import { SearchIcon } from "@/shared/ui/icons/SearchIcon";
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
    <div className="relative min-w-0 flex-1 sm:max-w-md">
      <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
      <TextInput
        id="vocabulary-search"
        aria-label="Search the word"
        className="h-7 rounded-md py-0 pr-2.5 pl-8 text-sm"
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder="Search the word"
      />
    </div>
  );
}
