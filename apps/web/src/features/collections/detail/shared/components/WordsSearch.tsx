"use client";

import { classNames } from "@/shared/lib/classNames";
import { useT } from "@/shared/providers/LocaleProvider";
import { SearchIcon } from "@/shared/ui/icons/SearchIcon";
import { TextInput } from "@/shared/ui/TextInput";

type WordsSearchProps = {
  onSearchChange: (search: string) => void;
  search: string;
};

export function WordsSearch({
  onSearchChange,
  search,
}: WordsSearchProps) {
  const t = useT();

  return (
    <div className="relative min-w-0 flex-1">
      <SearchIcon className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground" />
      <TextInput
        id="words-search"
        aria-label={t("wordsTable.searchAria")}
        className={classNames(
          "rounded-lg border border-border bg-surface px-4 py-2 pl-11 pr-4 text-sm shadow-card focus:border-primary",
        )}
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder={t("wordsTable.searchPlaceholder")}
      />
    </div>
  );
}
