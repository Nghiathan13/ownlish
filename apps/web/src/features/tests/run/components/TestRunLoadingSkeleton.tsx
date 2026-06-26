import type { ReactNode } from "react";
import { PageShell } from "@/shared/ui/PageShell";
import { Skeleton } from "@/shared/ui/Skeleton";

export type TestRunLoadingVariant =
  | "practice"
  | "review_wrong"
  | "mock_test"
  | "part_practice";

type TestRunLoadingSkeletonProps = {
  variant: TestRunLoadingVariant;
};

function RunBottomNavSkeleton() {
  return (
    <div aria-hidden className="flex items-center justify-end gap-2">
      <Skeleton className="size-10 rounded-lg" />
      <Skeleton className="size-10 rounded-lg" />
      <Skeleton className="size-10 rounded-lg" />
    </div>
  );
}

function RunQuestionOptionsSkeleton() {
  return (
    <div className="grid gap-2">
      {Array.from({ length: 4 }, (_, index) => (
        <Skeleton className="h-12 w-full rounded-lg" key={index} />
      ))}
    </div>
  );
}

function RunContentAreaSkeleton() {
  return (
    <div
      aria-hidden
      className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden p-4 lg:flex-row"
    >
      <Skeleton className="min-h-48 w-full rounded-xl lg:min-h-0 lg:flex-1" />
      <div className="flex w-full flex-col gap-3 lg:flex-1">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <RunQuestionOptionsSkeleton />
      </div>
    </div>
  );
}

function ContinuousRunShellSkeleton({
  children,
  variant,
}: {
  children: ReactNode;
  variant: TestRunLoadingVariant;
}) {
  return (
    <PageShell data-variant={variant} fillViewport>
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {children}
        </div>
        <div className="shrink-0 border-t border-border p-4">
          <RunBottomNavSkeleton />
        </div>
      </div>
    </PageShell>
  );
}

export function TestRunLoadingSkeleton({
  variant,
}: TestRunLoadingSkeletonProps) {
  return (
    <ContinuousRunShellSkeleton variant={variant}>
      <RunContentAreaSkeleton />
    </ContinuousRunShellSkeleton>
  );
}
