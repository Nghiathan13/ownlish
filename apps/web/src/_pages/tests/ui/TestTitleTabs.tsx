"use client";

import { usePathname } from "next/navigation";
import {
  DEFAULT_TOEIC_YEAR,
  getTestsListPath,
  getTestsOverviewPath,
} from "@/entities/toeic-runtime";
import { useT } from "@/shared/lib/providers";
import { PageHeader, PageHeaderTabs } from "@/shared/ui/page-header";

export function TestTitleTabs() {
  const t = useT();
  const pathname = usePathname();
  const activeTab = pathname.startsWith("/tests/part-practice")
    ? "part_practice"
    : "mock_tests";

  return (
    <PageHeader>
      <PageHeaderTabs
        activeKey={activeTab}
        ariaLabel={t("nav.tests")}
        items={[
          {
            href: getTestsListPath(DEFAULT_TOEIC_YEAR),
            key: "mock_tests",
            label: t("nav.mockTests"),
          },
          {
            href: getTestsOverviewPath({ tab: "part_practice" }),
            key: "part_practice",
            label: t("nav.partPractice"),
          },
        ]}
      />
    </PageHeader>
  );
}
