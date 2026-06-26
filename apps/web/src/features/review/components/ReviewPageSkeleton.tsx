import { PageShell } from "@/shared/ui/PageShell";
import { Panel } from "@/shared/ui/Panel";
import { ReviewCardSkeleton } from "./ReviewCardSkeleton";
import { ReviewCollectionToolbarSkeleton } from "./ReviewCollectionToolbarSkeleton";

export function ReviewPageSkeleton() {
  return (
    <PageShell>
      <Panel>
        <ReviewCollectionToolbarSkeleton />
        <ReviewCardSkeleton />
      </Panel>
    </PageShell>
  );
}
