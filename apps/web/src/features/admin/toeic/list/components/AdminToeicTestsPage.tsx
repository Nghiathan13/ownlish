"use client";

import { useMemo, useState } from "react";
import { AdminToeicTestCard } from "@/features/admin/toeic/list/components/AdminToeicTestCard";
import { useAdminToeicTestsQuery } from "@/features/admin/toeic/list/hooks/useAdminToeicTestsQuery";
import {
  filterAdminToeicTestsByYear,
  getAdminToeicTestYears,
  resolveAdminToeicSelectedYear,
} from "@/features/admin/toeic/list/lib/adminToeicTestYears";
import { getToeicYearButtonLabel } from "@/features/tests/shared/constants/toeicYears";
import {
  primaryTextButtonClassName,
  secondaryTextButtonClassName,
} from "@/shared/ui/button";
import { PageShell } from "@/shared/ui/PageShell";
import { SkeletonCardGrid } from "@/shared/skeletons/SkeletonCardGrid";

export function AdminToeicTestsPage() {
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const { tests, isLoading, error } = useAdminToeicTestsQuery({
    enabled: true,
  });
  const catalogYears = useMemo(() => getAdminToeicTestYears(), []);
  const effectiveYear = useMemo(
    () => resolveAdminToeicSelectedYear(catalogYears, selectedYear),
    [catalogYears, selectedYear],
  );
  const visibleTests = useMemo(
    () => filterAdminToeicTestsByYear(tests, effectiveYear),
    [effectiveYear, tests],
  );

  return (
    <PageShell>
      <div className="mb-4 flex flex-col items-start gap-2 px-4">
        <button className={primaryTextButtonClassName()} type="button">
          TOEIC
        </button>
        <div className="flex flex-wrap gap-2">
          {catalogYears.map((year) => (
            <button
              aria-current={effectiveYear === year ? "true" : undefined}
              className={
                effectiveYear === year
                  ? primaryTextButtonClassName()
                  : secondaryTextButtonClassName()
              }
              key={year}
              onClick={() => setSelectedYear(year)}
              type="button"
            >
              {getToeicYearButtonLabel(year)}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-4 flex flex-col gap-4 px-4">
        {isLoading ? (
          <SkeletonCardGrid className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" />
        ) : error ? (
          <p className="text-muted-foreground">Cannot load TOEIC tests.</p>
        ) : visibleTests.length === 0 ? (
          <p className="text-muted-foreground">
            No tests available for this year yet.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {visibleTests.map((test) => (
              <AdminToeicTestCard key={test.id} test={test} />
            ))}
          </div>
        )}
      </div>
    </PageShell>
  );
}
