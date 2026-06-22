import { BackToCollectionsLink } from "@/features/collections/detail/page/components/BackToCollectionsLink";
import { WordsTableSkeleton } from "@/features/collections/detail/shared/components/WordsTableSkeleton";
import { getVocabularyWordsTableHeadColumns } from "@/features/collections/detail/shared/lib/wordsTableHeadColumns";
import { createDefaultColumnVisibility } from "@/features/collections/detail/user/panel/lib/vocabularyTableColumns";
import { PageShell } from "@/shared/ui/PageShell";
import { Skeleton } from "@/shared/ui/Skeleton";

const defaultVocabularyHeadColumns = getVocabularyWordsTableHeadColumns(
  createDefaultColumnVisibility(),
);

export function CollectionDetailPageSkeleton() {
  return (
    <PageShell fillViewport>
      <div className="mb-4 grid shrink-0 grid-cols-[1fr_auto_1fr] items-center gap-2 px-4">
        <BackToCollectionsLink />
        <Skeleton className="h-10 min-w-[10rem] max-w-[14rem] shrink-0" />
      </div>

      <div className="mb-4 flex shrink-0 flex-col gap-2 px-4 sm:flex-row sm:items-center">
        <Skeleton className="h-10 w-28 shrink-0" />
        <Skeleton className="h-10 min-w-0 flex-1" />
        <Skeleton className="h-10 w-24 shrink-0" />
      </div>

      <WordsTableSkeleton
        columns={defaultVocabularyHeadColumns}
        showActions
      />
    </PageShell>
  );
}
