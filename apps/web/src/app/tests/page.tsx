import { RequireAuth } from "@/features/auth/components/RequireAuth";
import { TestsPage } from "@/features/tests/components/overview/TestsPage";

export default function TestsRoute() {
  return (
    <RequireAuth>
      <TestsPage />
    </RequireAuth>
  );
}
