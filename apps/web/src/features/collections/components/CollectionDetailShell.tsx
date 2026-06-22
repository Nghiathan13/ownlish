"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { Suspense, useCallback, useState } from "react";
import { VocabularyColumnPicker } from "@/features/collections/words/components/VocabularyColumnPicker";
import { VocabularySearch } from "@/features/collections/words/components/VocabularySearch";
import { useVocabularyTableColumnVisibility } from "@/features/collections/words/hooks/useVocabularyTableColumnVisibility";
import { VOCABULARY_TOGGLEABLE_COLUMNS } from "@/features/collections/words/lib/vocabularyTableColumns";
import { iconTextButtonClassName } from "@/shared/ui/button";
import { AddIcon } from "@/shared/ui/icons/AddIcon";
import { ArrowBackIcon } from "@/shared/ui/icons/ArrowBackIcon";
import { PageShell } from "@/shared/ui/PageShell";

const CollectionDetailContent = dynamic(
  () =>
    import("@/features/collections/components/CollectionDetailContent").then(
      (module) => module.CollectionDetailContent,
    ),
  { ssr: false },
);

type CollectionDetailShellProps = {
  collectionId: string;
};

export function CollectionDetailShell({
  collectionId,
}: CollectionDetailShellProps) {
  const [showToolbarShell, setShowToolbarShell] = useState(true);
  const handleContentMounted = useCallback(() => {
    setShowToolbarShell(false);
  }, []);

  return (
    <PageShell fillViewport>
      <div className="mb-4 shrink-0 px-4">
        <Link
          className={iconTextButtonClassName(
            "w-fit shrink-0",
            "border-foreground bg-foreground text-background",
          )}
          href="/collections"
        >
          <ArrowBackIcon />
          Back to collections
        </Link>
      </div>
      {showToolbarShell ? <CollectionDetailToolbarShell /> : null}
      <Suspense fallback={null}>
        <CollectionDetailContent
          collectionId={collectionId}
          onMounted={handleContentMounted}
        />
      </Suspense>
    </PageShell>
  );
}

function CollectionDetailToolbarShell() {
  const [search, setSearch] = useState("");
  const { columnVisibility, toggleColumn } =
    useVocabularyTableColumnVisibility();

  return (
    <div className="mb-4 flex shrink-0 flex-col gap-2 px-4 sm:flex-row sm:items-center">
      <div className="flex shrink-0 items-center gap-2">
        <button
          aria-disabled="true"
          className={iconTextButtonClassName(
            "w-fit shrink-0",
            "border-foreground bg-foreground text-background",
            "pointer-events-none opacity-70",
          )}
          disabled
          type="button"
        >
          <AddIcon />
          Add word
        </button>
      </div>
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <VocabularySearch
          disabled
          onSearchChange={setSearch}
          search={search}
        />
        <VocabularyColumnPicker
          columnVisibility={columnVisibility}
          columns={VOCABULARY_TOGGLEABLE_COLUMNS}
          onToggleColumn={toggleColumn}
        />
      </div>
    </div>
  );
}
