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
          "mx-4 mb-4 grid content-start gap-3 overflow-auto [grid-template-columns:repeat(auto-fit,minmax(max(300px,calc(50%-0.375rem)),1fr))] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden lg:hidden",
          className,
        )}
      >
        {Array.from({ length: SKELETON_ROW_COUNT }, (_, index) => (
          <Skeleton
            className="h-24 min-w-0 w-full rounded-xl border border-border"
            key={index}
          />
        ))}
      </div>
    </>
  );
}
