import type { ComponentType, SVGProps } from "react";
import {
  DEFAULT_TOEIC_YEAR,
  getTestsListPath,
} from "@/features/tests/shared/constants/toeicYears";
import { CollectionsNavIcon } from "@/shared/ui/icons/CollectionsNavIcon";
import { DashboardNavIcon } from "@/shared/ui/icons/DashboardNavIcon";
import { ReviewNavIcon } from "@/shared/ui/icons/ReviewNavIcon";
import { TestsNavIcon } from "@/shared/ui/icons/TestsNavIcon";

export type AppNavIcon = ComponentType<SVGProps<SVGSVGElement>>;

export type AppNavLink = {
  href: string;
  label: string;
  activeMatch?: string;
  icon: AppNavIcon;
};

export const APP_NAV_LINKS: AppNavLink[] = [
  { href: "/", label: "Dashboard", icon: DashboardNavIcon },
  {
    href: "/collections?tab=user",
    label: "Collections",
    activeMatch: "/collections",
    icon: CollectionsNavIcon,
  },
  { href: "/review", label: "Review", icon: ReviewNavIcon },
  {
    href: getTestsListPath(DEFAULT_TOEIC_YEAR),
    label: "Tests",
    activeMatch: "/tests",
    icon: TestsNavIcon,
  },
];

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

  return `text-base font-semibold ${
    isActive
      ? "text-foreground"
      : "text-muted-foreground hover:text-foreground"
  }`;
}
