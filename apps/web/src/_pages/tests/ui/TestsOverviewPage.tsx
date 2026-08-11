import { Suspense } from "react";
import { RequireAuth } from "@/features/auth";
import { TestsPage } from "./overview/components/TestsPage";
import { TestsOverviewPageSkeleton } from "./overview/components/TestsOverviewPageSkeleton";

export function TestsOverviewPage() {
  return (
    <RequireAuth>
      <Suspense fallback={<TestsOverviewPageSkeleton />}>
        <TestsPage />
      </Suspense>
    </RequireAuth>
  );
}
