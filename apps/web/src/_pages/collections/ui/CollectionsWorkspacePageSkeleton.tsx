import { CollectionsGridSkeleton } from "@/features/collections";
import { PageShell } from "@/shared/ui/PageShell";
import { Skeleton } from "@/shared/ui/Skeleton";

export function CollectionsWorkspacePageSkeleton() {
  return (
    <PageShell>
      <div className="my-3 px-4 lg:my-6 lg:px-16">
        <div className="relative flex items-end gap-9 pl-3 pb-3">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-5 w-16" />
          <div
            aria-hidden
            className="pointer-events-none absolute bottom-0 -left-4 -right-4 h-[0.6px] bg-border lg:-left-16 lg:-right-16"
          />
        </div>
      </div>
      <CollectionsGridSkeleton />
    </PageShell>
  );
}
