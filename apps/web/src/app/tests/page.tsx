import { RequireAuth } from "@/features/auth/components/RequireAuth";
import { TestsPage } from "@/features/tests/components/TestsPage";

export default function TestsRoute() {
  return (
    <RequireAuth>
      <TestsPage />
    </RequireAuth>
  );
}
