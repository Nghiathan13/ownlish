import { classNames } from "@/shared/lib/classNames";
import { Panel } from "@/shared/ui/Panel";
import { PageShell } from "@/shared/ui/PageShell";
import { PANEL_CARD_CLASS } from "@/shared/ui/layout";
import { Skeleton } from "@/shared/ui/Skeleton";

type SessionLoadingSkeletonProps = {
  centered?: boolean;
};

export function SessionLoadingSkeleton({
  centered = false,
}: SessionLoadingSkeletonProps) {
  return (
    <PageShell centered={centered}>
      <Panel
        className={classNames(
          centered && PANEL_CARD_CLASS,
          centered && "w-[min(420px,100%)]",
        )}
      >
        <div className="flex flex-col gap-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-3/4 max-w-xs" />
          <Skeleton className="h-4 w-2/3 max-w-[200px]" />
        </div>
      </Panel>
    </PageShell>
  );
}
