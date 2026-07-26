"use client";

import { useSearchParams } from "next/navigation";
import { TESTS_SUB_LINKS } from "@/features/shell/lib/appNavLinks";
import { parseTestsOverviewTab } from "@/features/tests/shared/lib/partPracticePaths";
import { useT } from "@/shared/providers/LocaleProvider";
import { UnderlineTabs } from "@/shared/ui/UnderlineTabs";

export function TestsOverviewTabs() {
  const t = useT();
  const searchParams = useSearchParams();
  const activeTab = parseTestsOverviewTab(searchParams.get("tab"));

  return (
    <div className="mt-4 px-4 lg:mt-8 lg:px-16">
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
