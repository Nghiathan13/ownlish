import { RequireAuth } from "@/features/auth";
import { PageShell } from "@/shared/ui/PageShell";
import { PracticeTab } from "./overview/components/PracticeTab";
import { TestsOverviewTabs } from "./overview/components/TestsOverviewTabs";

export function PartPracticePage() {
  return (
    <RequireAuth>
      <PageShell>
        <TestsOverviewTabs />
        <PracticeTab />
      </PageShell>
    </RequireAuth>
  );
}
