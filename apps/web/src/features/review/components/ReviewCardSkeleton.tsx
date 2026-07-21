import { Skeleton } from "@/shared/ui/Skeleton";

export function ReviewCardSkeleton() {
  return (
    <div aria-hidden className="mx-auto grid w-full max-w-3xl gap-3">
      <div className="rounded-[1.75rem] bg-surface p-5 shadow-card sm:p-8">
        <div className="mb-8 grid gap-2">
          <div className="flex justify-center">
            <Skeleton className="h-4 w-12" />
          </div>
          <Skeleton className="h-1.5 w-full rounded-full" />
        </div>

        <div className="grid min-h-[18rem] content-center gap-6 text-center sm:min-h-[22rem]">
          <div>
            <Skeleton className="mx-auto h-16 w-4/5 max-w-lg rounded-2xl sm:h-24" />
            <div className="mt-3 flex justify-center gap-2">
              <Skeleton className="h-5 w-24 rounded-md" />
              <Skeleton className="h-6 w-14 rounded-full" />
            </div>
          </div>
          <Skeleton className="mx-auto min-h-24 w-full max-w-xl rounded-2xl" />
        </div>
      </div>
      <Skeleton className="mx-auto h-6 w-48" />
    </div>
  );
}
