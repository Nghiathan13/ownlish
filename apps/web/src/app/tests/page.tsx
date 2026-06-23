import { Suspense } from "react";
import { RequireAuth } from "@/features/auth/components/RequireAuth";
import { TestsPage } from "@/features/tests/overview/components/TestsPage";
import { TestsPageSkeleton } from "@/features/tests/overview/components/TestsPageSkeleton";

export default function TestsRoute() {
  return (
    <RequireAuth>
      <Suspense fallback={<TestsPageSkeleton />}>
        <TestsPage />
      </Suspense>
    </RequireAuth>
  );
}
