import type { ComponentType, SVGProps } from "react";
import {
  DASHBOARD_MY_ACTIVITY_PATH,
  DASHBOARD_ROOT_PATH,
} from "@/shared/routes";
import {
  DEFAULT_TOEIC_YEAR,
  getTestsListPath,
} from "@/entities/toeic-runtime";
import type { MessageKey } from "@/shared/i18n";
import { CollectionsNavFillIcon } from "@/shared/ui/icons";
import { CollectionsNavIcon } from "@/shared/ui/icons";
import { DashboardNavFillIcon } from "@/shared/ui/icons";
import { DashboardNavIcon } from "@/shared/ui/icons";
import { DictationIcon } from "@/shared/ui/icons";
import { DictationFillIcon } from "@/shared/ui/icons";
import { ReviewNavFillIcon } from "@/shared/ui/icons";
import { ReviewNavIcon } from "@/shared/ui/icons";
import { TestsNavFillIcon } from "@/shared/ui/icons";
import { TestsNavIcon } from "@/shared/ui/icons";

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
    href: DASHBOARD_MY_ACTIVITY_PATH,
    labelKey: "nav.dashboard",
    activeMatch: DASHBOARD_ROOT_PATH,
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
    href: "/dictation",
    labelKey: "nav.dictation",
    icon: DictationIcon,
    activeIcon: DictationFillIcon,
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
      ? "bg-surface-subtle hover:[box-shadow:inset_0_0_0_9999px_var(--hover-overlay)]"
      : "hover:bg-hover-overlay"
  }`;
}
