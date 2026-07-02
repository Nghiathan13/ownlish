import { PageShell } from "@/shared/ui/PageShell";
import { Panel } from "@/shared/ui/Panel";
import { Skeleton } from "@/shared/ui/Skeleton";
import { ReviewCardSkeleton } from "./ReviewCardSkeleton";

export function ReviewPageSkeleton() {
  return (
    <PageShell className="bg-[radial-gradient(circle_at_top_left,color-mix(in_srgb,var(--foreground)_9%,transparent),transparent_30rem)]">
      <Panel className="mx-auto flex min-h-full w-full max-w-6xl flex-col px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div className="mb-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div>
            <Skeleton className="mb-2 h-4 w-32" />
            <Skeleton className="h-14 w-4/5 max-w-2xl rounded-2xl" />
            <Skeleton className="mt-4 h-6 w-3/4 max-w-xl" />
          </div>
          <Skeleton className="h-20 w-56 rounded-2xl lg:justify-self-end" />
        </div>
        <ReviewCardSkeleton />
      </Panel>
    </PageShell>
  );
}
