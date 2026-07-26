import { PageShell } from "@/shared/ui/PageShell";
import { Skeleton } from "@/shared/ui/Skeleton";
import { ReviewCardSkeleton } from "./ReviewCardSkeleton";
import { ReviewWorkspaceRow } from "./ReviewWorkspace";

export function ReviewPageSkeleton() {
  return (
    <PageShell>
      <div className="my-4 flex flex-wrap items-center gap-4 px-4 lg:my-8 lg:px-16">
        <Skeleton className="h-10 w-40 rounded-lg" />
      </div>
      <ReviewWorkspaceRow
        navigation={
          <>
            <Skeleton className="h-10 w-[200px] rounded-lg lg:hidden" />
            <div className="hidden max-h-[480px] w-full shrink-0 flex-col overflow-hidden rounded-lg border border-border bg-surface p-1 lg:flex lg:w-[200px] dark:bg-[#000000]">
              <div className="grid min-h-0 flex-1 gap-1 overflow-y-auto">
                {Array.from({ length: 4 }, (_, index) => (
                  <Skeleton className="h-8 rounded-md" key={index} />
                ))}
              </div>
            </div>
          </>
        }
        rail={<Skeleton className="h-20 shrink-0 self-start rounded-lg" />}
      >
        <ReviewCardSkeleton />
      </ReviewWorkspaceRow>
    </PageShell>
  );
}
