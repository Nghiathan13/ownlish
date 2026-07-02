import { Skeleton } from "@/shared/ui/Skeleton";

export function ReviewCardSkeleton() {
  return (
    <div aria-hidden className="mx-auto grid w-full max-w-3xl gap-3">
      <div className="rounded-[1.75rem] border border-border bg-background p-5 sm:p-8">
        <div className="mb-8 grid gap-2">
          <div className="flex items-center justify-between gap-4">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-4 w-16" />
          </div>
          <Skeleton className="h-1.5 w-full rounded-full" />
        </div>

        <div className="grid min-h-[18rem] content-center gap-6 text-center sm:min-h-[22rem]">
          <div>
            <Skeleton className="mx-auto h-20 w-4/5 max-w-xl rounded-2xl sm:h-28" />
            <div className="mt-6 flex justify-center gap-2">
              <Skeleton className="h-8 w-28 rounded-full" />
              <Skeleton className="h-8 w-24 rounded-full" />
              <Skeleton className="h-8 w-20 rounded-full" />
            </div>
          </div>
          <Skeleton className="mx-auto min-h-24 w-full max-w-xl rounded-2xl" />
        </div>
      </div>
      <Skeleton className="mx-auto h-6 w-48" />
    </div>
  );
}
