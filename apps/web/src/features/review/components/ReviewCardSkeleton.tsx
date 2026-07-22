import { Skeleton } from "@/shared/ui/Skeleton";

export function ReviewCardSkeleton() {
  return (
    <div aria-hidden className="mx-auto grid w-full max-w-3xl gap-3">
      <div className="rounded-[1.75rem] bg-surface p-5 shadow-card sm:p-8 dark:border dark:border-border">
        <div className="mb-8 grid gap-3">
          <div className="mx-auto flex w-fit gap-1 rounded-xl bg-muted p-1 dark:border dark:border-border">
            <div className="h-[30px] w-[5.5rem] rounded-lg bg-foreground" />
            <Skeleton className="h-[30px] w-[5rem] rounded-lg" />
          </div>

          <div className="grid w-full gap-2">
            <div className="flex justify-center">
              <Skeleton className="h-5 w-10" />
            </div>
            <Skeleton className="h-1.5 w-full rounded-full" />
          </div>
        </div>

        <div className="grid min-h-[18rem] content-center gap-6 text-center sm:min-h-[22rem]">
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

      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
        <Skeleton className="h-5 w-28" />
      </div>
    </div>
  );
}
