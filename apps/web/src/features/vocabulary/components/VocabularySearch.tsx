import { classNames } from "@/shared/lib/classNames";
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
    <div className="relative min-w-0 flex-1">
      <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
      <TextInput
        id="vocabulary-search"
        aria-label="Search the word"
        className={classNames("rounded-md px-2.5 py-1.5 text-sm", "pl-10 pr-3")}
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder="Search the word"
      />
    </div>
  );
}
