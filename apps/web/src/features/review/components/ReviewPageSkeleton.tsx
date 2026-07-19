import { PageShell } from "@/shared/ui/PageShell";
import { Panel } from "@/shared/ui/Panel";
import { Skeleton } from "@/shared/ui/Skeleton";
import { ReviewCardSkeleton } from "./ReviewCardSkeleton";

export function ReviewPageSkeleton() {
  return (
    <PageShell>
      <Panel className="mx-auto flex min-h-full w-full max-w-4xl flex-col p-4 lg:p-16">
        <div className="mb-4 flex justify-end">
          <Skeleton className="h-10 w-48 max-w-[14rem] rounded-lg" />
        </div>
        <ReviewCardSkeleton />
      </Panel>
    </PageShell>
  );
}
