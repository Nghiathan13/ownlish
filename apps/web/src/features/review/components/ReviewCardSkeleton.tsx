import { Skeleton } from "@/shared/ui/Skeleton";

export function ReviewCardSkeleton() {
  return (
    <>
      <div
        aria-hidden
        className="flex h-[480px] flex-col rounded-lg bg-surface p-5 shadow-card sm:p-8 dark:border dark:border-border"
      >
        <div className="mb-8 shrink-0">
          <Skeleton className="mx-auto h-4 w-16" />
          <Skeleton className="mt-2 h-1.5 w-full rounded-full" />
        </div>

        <div className="grid min-h-0 flex-1 content-center gap-6 text-center">
          <div>
            <div className="flex flex-wrap items-start justify-center gap-2">
              <Skeleton className="h-10 w-48 rounded-xl sm:h-14 sm:w-64" />
              <Skeleton className="mt-2 h-5 w-14 rounded-md" />
              <Skeleton className="mt-2.5 h-5 w-10 rounded-full" />
            </div>
            <div className="mt-2 flex justify-center">
              <Skeleton className="h-5 w-28 rounded-md" />
            </div>
          </div>
        </div>
      </div>

      <div aria-hidden className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton className="h-10 rounded-lg" key={index} />
        ))}
      </div>
    </>
  );
}
