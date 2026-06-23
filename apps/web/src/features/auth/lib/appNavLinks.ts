import {
  DEFAULT_TOEIC_YEAR,
  getTestsListPath,
} from "@/features/tests/shared/constants/toeicYears";

export type AppNavLink = {
  href: string;
  label: string;
  activeMatch?: string;
};

export const APP_NAV_LINKS: AppNavLink[] = [
  { href: "/", label: "Dashboard" },
  {
    href: "/collections?tab=user",
    label: "Collections",
    activeMatch: "/collections",
  },
  { href: "/review", label: "Review" },
  {
    href: getTestsListPath(DEFAULT_TOEIC_YEAR),
    label: "Tests",
    activeMatch: "/tests",
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
