import { Suspense } from "react";
import { RequireAuth } from "@/features/auth/components/RequireAuth";
import { TestsPage } from "@/features/tests/overview/components/TestsPage";
import { TestsOverviewPageSkeleton } from "@/features/tests/overview/components/TestsOverviewPageSkeleton";

export default function TestsRoute() {
  return (
    <RequireAuth>
      <Suspense fallback={<TestsOverviewPageSkeleton />}>
        <TestsPage />
      </Suspense>
    </RequireAuth>
  );
}
