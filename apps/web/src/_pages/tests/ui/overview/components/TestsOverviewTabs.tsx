"use client";

import { useSearchParams } from "next/navigation";
import { TESTS_SUB_LINKS } from "@/features/shell";
import { parseTestsOverviewTab } from "@/entities/toeic-runtime";
import { useT } from "@/shared/lib/providers";
import { UnderlineTabs } from "@/shared/ui/UnderlineTabs";

export function TestsOverviewTabs() {
  const t = useT();
  const searchParams = useSearchParams();
  const activeTab = parseTestsOverviewTab(searchParams.get("tab"));

  return (
    <div className="mt-3 px-4 lg:mt-6 lg:px-16">
      <UnderlineTabs
        activeKey={activeTab}
        ariaLabel={t("nav.tests")}
        items={TESTS_SUB_LINKS.map((link) => ({
          href: link.href,
          key: link.tab,
          label: t(link.labelKey),
        }))}
      />
    </div>
  );
}
