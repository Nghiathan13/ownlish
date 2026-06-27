"use client";

import { useMemo, useState } from "react";
import { AdminToeicTestCard } from "@/features/admin/toeic/list/components/AdminToeicTestCard";
import { useAdminToeicTestsQuery } from "@/features/admin/toeic/list/hooks/useAdminToeicTestsQuery";
import {
  filterAdminToeicTestsByYear,
  getAdminToeicTestYears,
  resolveAdminToeicSelectedYear,
} from "@/features/admin/toeic/list/lib/adminToeicTestYears";
import {
  primaryTextButtonClassName,
  secondaryTextButtonClassName,
} from "@/shared/ui/button";
import { PageShell } from "@/shared/ui/PageShell";
import { Panel } from "@/shared/ui/Panel";

export function AdminToeicTestsPage() {
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const { tests, isLoading, error } = useAdminToeicTestsQuery({
    enabled: true,
  });
  const availableYears = useMemo(() => getAdminToeicTestYears(tests), [tests]);
  const effectiveYear = useMemo(
    () => resolveAdminToeicSelectedYear(availableYears, selectedYear),
    [availableYears, selectedYear],
  );
  const visibleTests = useMemo(
    () => filterAdminToeicTestsByYear(tests, effectiveYear),
    [effectiveYear, tests],
  );

  return (
    <PageShell>
      <Panel>
        <div className="flex flex-col gap-6">
          {availableYears.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {availableYears.map((year) => (
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
                  {year}
                </button>
              ))}
            </div>
          ) : null}

          {isLoading ? (
            <p className="text-muted-foreground">Loading tests…</p>
          ) : error ? (
            <p className="text-muted-foreground">Cannot load TOEIC tests.</p>
          ) : tests.length === 0 ? (
            <p className="text-muted-foreground">No TOEIC tests found.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {visibleTests.map((test) => (
                <AdminToeicTestCard key={test.id} test={test} />
              ))}
            </div>
          )}
        </div>
      </Panel>
    </PageShell>
  );
}
