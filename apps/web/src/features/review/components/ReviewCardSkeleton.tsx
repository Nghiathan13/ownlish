import { Skeleton } from "@/shared/ui/Skeleton";

export function ReviewCardSkeleton() {
  return (
    <div aria-hidden className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
      <div className="rounded-[2rem] border border-border bg-background p-5 sm:p-8 lg:min-h-[34rem]">
        <div className="flex items-center justify-between gap-3">
          <Skeleton className="h-8 w-40 rounded-full" />
          <Skeleton className="hidden h-7 w-24 rounded-md sm:block" />
        </div>

        <div className="grid gap-5 py-12 sm:py-16">
          <Skeleton className="h-20 w-4/5 max-w-2xl rounded-2xl sm:h-28" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-24 rounded-full" />
            <Skeleton className="h-8 w-20 rounded-full" />
          </div>
          <Skeleton className="min-h-36 w-full rounded-3xl" />
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <Skeleton className="h-12 w-full rounded-lg" />
          <Skeleton className="h-12 w-full rounded-lg" />
          <Skeleton className="h-12 w-full rounded-lg" />
        </div>
      </div>

      <div className="grid gap-4 lg:content-start">
        <Skeleton className="h-40 rounded-[1.5rem]" />
        <Skeleton className="h-44 rounded-[1.5rem]" />
      </div>
    </div>
  );
}
