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
      <SearchIcon className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground" />
      <TextInput
        id="vocabulary-search"
        aria-label="Search the word"
        className={classNames("rounded-md px-4 py-2 pl-11 pr-4 text-sm")}
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder="Search the word"
      />
    </div>
  );
}
