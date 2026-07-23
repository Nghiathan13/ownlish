import type { WordsTableHeadColumn } from "@/features/collections/detail/shared/components/WordsTableHead";
import { WordsTableHead } from "@/features/collections/detail/shared/components/WordsTableHead";
import { WordsTableDesktopLayout } from "@/features/collections/detail/shared/components/WordsTableDesktopLayout";
import { classNames } from "@/shared/lib/classNames";
import { Skeleton } from "@/shared/ui/Skeleton";

const SKELETON_ROW_COUNT = 4;

type WordsTableSkeletonProps = {
  className?: string;
  columns: WordsTableHeadColumn[];
  showActions?: boolean;
};

export function WordsTableSkeleton({
  className,
  columns,
  showActions = false,
}: WordsTableSkeletonProps) {
  const bodyColSpan = 1 + columns.length + (showActions ? 1 : 0);

  return (
    <>
      <WordsTableDesktopLayout
        className={className}
        head={
          <WordsTableHead columns={columns} actions={showActions} checkbox />
        }
        body={Array.from({ length: SKELETON_ROW_COUNT }, (_, index) => (
          <tr
            className={classNames(
              "h-12",
              index < SKELETON_ROW_COUNT - 1 && "border-b border-border",
            )}
            key={index}
          >
            <td className="w-10 px-3 align-middle" />
            <td className="px-2 align-middle" colSpan={bodyColSpan}>
              <Skeleton className="h-6 w-full rounded-md" />
            </td>
          </tr>
        ))}
      />
      <div
        className={classNames(
          "mx-4 mb-4 flex flex-col gap-3 overflow-auto rounded-xl bg-surface p-4 shadow-card md:hidden dark:border dark:border-border",
          className,
        )}
      >
        {Array.from({ length: SKELETON_ROW_COUNT }, (_, index) => (
          <Skeleton
            className={classNames(
              "h-24 w-full rounded-lg",
              index < SKELETON_ROW_COUNT - 1 && "border-b border-border pb-3",
            )}
            key={index}
          />
        ))}
      </div>
    </>
  );
}
