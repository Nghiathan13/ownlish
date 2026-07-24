"use client";

import { useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MockTestsTab } from "@/features/tests/overview/components/MockTestsTab";
import { PracticeTab } from "@/features/tests/overview/components/PracticeTab";
import { TestsOverviewPageSkeleton } from "@/features/tests/overview/components/TestsOverviewPageSkeleton";
import { resolveToeicSelectedYear } from "@/features/tests/overview/lib/toeicTestYears";
import {
  DEFAULT_TOEIC_YEAR,
  getTestsListPath,
  parseToeicYearParam,
  type ToeicYear,
} from "@/features/tests/shared/constants/toeicYears";
import {
  getTestsOverviewRedirectTarget,
  parseTestsOverviewTab,
} from "@/features/tests/shared/lib/partPracticePaths";
import {
  isAuthenticatedStatus,
  useAuthSession,
} from "@/features/auth/hooks/useAuthSession";
import { PageShell } from "@/shared/ui/PageShell";
import { useToeicCatalogQuery } from "@/entities/toeic-catalog/model/useToeicCatalogQuery";
import { useT } from "@/shared/providers/LocaleProvider";

export function TestsPage() {
  const t = useT();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status } = useAuthSession();
  const isAuthenticated = isAuthenticatedStatus(status);
  const catalog = useToeicCatalogQuery(isAuthenticated);
  const yearParam = searchParams.get("year");
  const requestedYear: ToeicYear =
    parseToeicYearParam(yearParam) ?? DEFAULT_TOEIC_YEAR;
  const selectedTab = parseTestsOverviewTab(searchParams.get("tab"));
  const redirectTarget = getTestsOverviewRedirectTarget(searchParams);
  const availableYears = useMemo(
    () =>
      Array.from(
        new Set(
          (catalog.data?.manifest.tests ?? []).map((test) => test.year),
        ),
      ).filter((year): year is ToeicYear => parseToeicYearParam(String(year)) !== null),
    [catalog.data],
  );
  const isLoadingYears = catalog.isLoading;
  const selectedYear = useMemo(() => {
    if (selectedTab !== "mock_tests" || isLoadingYears) {
      return requestedYear;
    }

    return (
      resolveToeicSelectedYear(availableYears, requestedYear) ?? requestedYear
    );
  }, [availableYears, isLoadingYears, requestedYear, selectedTab]);
  const yearRedirectTarget = useMemo(() => {
    if (
      selectedTab !== "mock_tests" ||
      isLoadingYears ||
      availableYears.length === 0
    ) {
      return null;
    }

    const resolvedYear = resolveToeicSelectedYear(
      availableYears,
      requestedYear,
    );

    if (resolvedYear == null || resolvedYear === requestedYear) {
      return null;
    }

    return getTestsListPath(resolvedYear);
  }, [availableYears, isLoadingYears, requestedYear, selectedTab]);
  useEffect(() => {
    if (redirectTarget) {
      router.replace(redirectTarget, { scroll: false });
    }
  }, [redirectTarget, router]);

  useEffect(() => {
    if (yearRedirectTarget) {
      router.replace(yearRedirectTarget, { scroll: false });
    }
  }, [router, yearRedirectTarget]);

  if (redirectTarget || yearRedirectTarget) {
    return (
      <TestsOverviewPageSkeleton
        selectedTab={selectedTab}
        selectedYear={selectedYear}
      />
    );
  }

  if (selectedTab === "mock_tests" && isLoadingYears) {
    return (
      <TestsOverviewPageSkeleton
        selectedTab={selectedTab}
        selectedYear={selectedYear}
      />
    );
  }

  return (
    <PageShell>
      {selectedTab === "part_practice" ? (
        <PracticeTab />
      ) : (
        <MockTestsTab
          availableYears={availableYears}
          catalogError={
            catalog.error instanceof Error
              ? catalog.error.message
              : catalog.error
                ? t("tests.cannotLoadCatalog")
                : null
          }
          selectedYear={selectedYear}
          source={catalog.data}
        />
      )}
    </PageShell>
  );
}
