"use client";

import { RequireAuth } from "@/features/auth";
import {
  isAuthenticatedStatus,
  useAuthSession,
} from "@/entities/session";
import { useToeicCatalogQuery } from "@/entities/toeic-catalog";
import { DEFAULT_TOEIC_YEAR, type ToeicYear } from "@/entities/toeic-runtime";
import { useT } from "@/shared/lib/providers";
import { PageShell } from "@/shared/ui/PageShell";
import { MockTestsTab } from "./overview/components/MockTestsTab";
import { TestsOverviewTabs } from "./overview/components/TestsOverviewTabs";

type MockTestsPageProps = {
  year?: ToeicYear;
};

export function MockTestsPage({
  year = DEFAULT_TOEIC_YEAR,
}: MockTestsPageProps) {
  const t = useT();
  const { status } = useAuthSession();
  const catalog = useToeicCatalogQuery(isAuthenticatedStatus(status));

  return (
    <RequireAuth>
      <PageShell>
        <TestsOverviewTabs />
        <MockTestsTab
          catalogError={
            catalog.error instanceof Error
              ? catalog.error.message
              : catalog.error
                ? t("tests.cannotLoadCatalog")
                : null
          }
          selectedYear={year}
          source={catalog.data}
        />
      </PageShell>
    </RequireAuth>
  );
}
