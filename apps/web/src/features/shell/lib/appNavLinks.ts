import type { ComponentType, SVGProps } from "react";
import {
  DEFAULT_TOEIC_YEAR,
  getTestsListPath,
} from "@/features/tests/shared/constants/toeicYears";
import {
  getTestsOverviewPath,
  type TestsOverviewTab,
} from "@/features/tests/shared/lib/partPracticePaths";
import type { MessageKey } from "@/shared/i18n/messages";
import { CollectionsNavFillIcon } from "@/shared/ui/icons/CollectionsNavFillIcon";
import { CollectionsNavIcon } from "@/shared/ui/icons/CollectionsNavIcon";
import { DashboardNavFillIcon } from "@/shared/ui/icons/DashboardNavFillIcon";
import { DashboardNavIcon } from "@/shared/ui/icons/DashboardNavIcon";
import { ReviewNavFillIcon } from "@/shared/ui/icons/ReviewNavFillIcon";
import { ReviewNavIcon } from "@/shared/ui/icons/ReviewNavIcon";
import { TestsNavFillIcon } from "@/shared/ui/icons/TestsNavFillIcon";
import { TestsNavIcon } from "@/shared/ui/icons/TestsNavIcon";

export type AppNavIcon = ComponentType<SVGProps<SVGSVGElement>>;

export type AppNavLink = {
  href: string;
  labelKey: MessageKey;
  activeMatch?: string;
  icon: AppNavIcon;
  activeIcon: AppNavIcon;
};

export const APP_NAV_LINKS: AppNavLink[] = [
  {
    href: "/",
    labelKey: "nav.dashboard",
    icon: DashboardNavIcon,
    activeIcon: DashboardNavFillIcon,
  },
  {
    href: "/collections/user",
    labelKey: "nav.collections",
    activeMatch: "/collections",
    icon: CollectionsNavIcon,
    activeIcon: CollectionsNavFillIcon,
  },
  {
    href: "/review",
    labelKey: "nav.review",
    icon: ReviewNavIcon,
    activeIcon: ReviewNavFillIcon,
  },
  {
    href: getTestsListPath(DEFAULT_TOEIC_YEAR),
    labelKey: "nav.tests",
    activeMatch: "/tests",
    icon: TestsNavIcon,
    activeIcon: TestsNavFillIcon,
  },
];

export function getAppNavLinksForUser(): AppNavLink[] {
  return APP_NAV_LINKS;
}

export function isAppNavLinkActive(
  pathname: string,
  link: AppNavLink,
): boolean {
  const matchPath = link.activeMatch ?? link.href.split("?")[0] ?? link.href;

  if (pathname === link.href || pathname === matchPath) {
    return true;
  }

  return matchPath !== "/" && pathname.startsWith(`${matchPath}/`);
}

export function getAppNavLinkClass(pathname: string, link: AppNavLink) {
  const isActive = isAppNavLinkActive(pathname, link);

  return `text-sm font-semibold transition-colors duration-200 ${
    isActive
      ? "text-foreground"
      : "text-muted-foreground hover:text-foreground"
  }`;
}

export function getAppSidebarLinkClass(pathname: string, link: AppNavLink) {
  const isActive = isAppNavLinkActive(pathname, link);

  return `text-base font-normal text-foreground ${
    isActive
      ? "bg-[#f0f0f0] hover:[box-shadow:inset_0_0_0_9999px_rgba(0,0,0,0.06)] dark:bg-surface dark:hover:[box-shadow:inset_0_0_0_9999px_var(--hover-overlay)]"
      : "hover:bg-hover-overlay"
  }`;
}

export type TestsSubLink = {
  href: string;
  labelKey: MessageKey;
  tab: TestsOverviewTab;
};

export const TESTS_SUB_LINKS: TestsSubLink[] = [
  {
    href: getTestsListPath(DEFAULT_TOEIC_YEAR),
    labelKey: "nav.mockTests",
    tab: "mock_tests",
  },
  {
    href: getTestsOverviewPath({ tab: "part_practice" }),
    labelKey: "nav.partPractice",
    tab: "part_practice",
  },
];
