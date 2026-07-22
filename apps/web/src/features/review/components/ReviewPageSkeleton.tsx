import { PageShell } from "@/shared/ui/PageShell";
import { Panel } from "@/shared/ui/Panel";
import { ReviewCardSkeleton } from "./ReviewCardSkeleton";
import { ReviewCollectionToolbarSkeleton } from "./ReviewCollectionToolbarSkeleton";

export function ReviewPageSkeleton() {
  return (
    <PageShell>
      <Panel className="mx-auto flex min-h-full w-full max-w-4xl flex-col p-4 lg:p-16">
        <div className="mb-8 flex justify-center">
          <ReviewCollectionToolbarSkeleton />
        </div>
        <ReviewCardSkeleton />
      </Panel>
    </PageShell>
  );
}
