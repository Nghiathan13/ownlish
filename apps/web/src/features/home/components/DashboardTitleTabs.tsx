"use client";

import { usePathname } from "next/navigation";
import {
  DASHBOARD_SUB_LINKS,
  parseDashboardSection,
} from "@/features/home/lib/dashboardPaths";
import { useT } from "@/shared/providers/LocaleProvider";
import { UnderlineTabs } from "@/shared/ui/UnderlineTabs";

export function DashboardTitleTabs() {
  const t = useT();
  const pathname = usePathname();
  const activeSection = parseDashboardSection(pathname) ?? "activity";

  return (
    <div className="mt-3 px-4 lg:mt-6 lg:px-16">
      <UnderlineTabs
        activeKey={activeSection}
        ariaLabel={t("nav.dashboard")}
        items={DASHBOARD_SUB_LINKS.map((link) => ({
          href: link.href,
          key: link.section,
          label: t(link.labelKey),
        }))}
      />
    </div>
  );
}
