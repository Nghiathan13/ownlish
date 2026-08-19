"use client";

import { usePathname } from "next/navigation";
import {
  DASHBOARD_SUB_LINKS,
  parseDashboardSection,
} from "../lib/dashboardPaths";
import { useT } from "@/shared/lib/providers";
import { PageHeader, PageHeaderTabs } from "@/shared/ui/page-header";

export function DashboardTitleTabs() {
  const t = useT();
  const pathname = usePathname();
  const activeSection = parseDashboardSection(pathname) ?? "activity";

  return (
    <PageHeader>
      <PageHeaderTabs
        activeKey={activeSection}
        ariaLabel={t("nav.dashboard")}
        items={DASHBOARD_SUB_LINKS.map((link) => ({
          href: link.href,
          key: link.section,
          label: t(link.labelKey),
        }))}
      />
    </PageHeader>
  );
}
