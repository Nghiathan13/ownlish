"use client";

import { Suspense, useState, type MouseEvent } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  useAuthSession,
  isAuthenticatedStatus,
  isLoadingStatus,
} from "@/features/auth/hooks/useAuthSession";
import { isAdminUser } from "@/features/auth/lib/isAdminUser";
import { SidebarUserMenu } from "@/features/shell/components/SidebarUserMenu";
import { SidebarThemeToggle } from "@/features/shell/components/SidebarThemeToggle";
import { ShellAuthSlotSkeleton } from "@/features/shell/components/ShellAuthSlotSkeleton";
import { ShellNavSkeleton } from "@/features/shell/components/ShellNavSkeleton";
import { useSidebarCollapsed } from "@/features/shell/hooks/useSidebarCollapsed";
import {
  ADMIN_NAV_LINKS,
  APP_NAV_LINKS,
  getAppSidebarLinkClass,
  isAppNavLinkActive,
  isTestsSubLinkActive,
  TESTS_SUB_LINKS,
} from "@/features/shell/lib/appNavLinks";
import { parseTestsOverviewTab } from "@/features/tests/shared/lib/partPracticePaths";
import { classNames } from "@/shared/lib/classNames";
import {
  iconOnlyButtonClassName,
  primaryTextButtonClassName,
} from "@/shared/ui/button";
import { ArrowForwardIcon } from "@/shared/ui/icons/ArrowForwardIcon";
import { PanelCloseIcon } from "@/shared/ui/icons/PanelCloseIcon";
import { PanelOpenIcon } from "@/shared/ui/icons/PanelOpenIcon";
import {
  sidebarLinkGroupClassName,
  sidebarToggleGroupClassName,
  Tooltip,
} from "@/shared/ui/Tooltip";

const sidebarToggleButtonClassName = classNames(
  iconOnlyButtonClassName(),
  sidebarToggleGroupClassName,
  "relative size-10 [&_svg]:size-6 text-foreground hover:bg-hover-overlay",
);

const sidebarCloseButtonClassName = classNames(
  sidebarToggleButtonClassName,
  "cursor-ew-resize",
);

const sidebarOpenButtonClassName = classNames(
  sidebarToggleButtonClassName,
  "cursor-ew-resize",
);

type TestsSubNavProps = {
  collapsed: boolean;
  testsExpanded: boolean;
};

function TestsSubNav({ collapsed, testsExpanded }: TestsSubNavProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentTab = parseTestsOverviewTab(searchParams.get("tab"));

  if (!testsExpanded) {
    return null;
  }

  if (collapsed) {
    return (
      <div className="flex flex-col items-center gap-1">
        {TESTS_SUB_LINKS.map((subLink) => {
          const isSubActive = isTestsSubLinkActive(pathname, currentTab, subLink);

          return (
            <Link
              aria-current={isSubActive ? "page" : undefined}
              aria-label={subLink.label}
              className={classNames(
                sidebarLinkGroupClassName,
                "relative flex size-10 items-center justify-center rounded-lg hover:bg-hover-overlay",
                isSubActive && "bg-muted",
              )}
              href={subLink.href}
              key={subLink.tab}
              scroll={false}
            >
              <span
                className={classNames(
                  "size-2 rounded-full",
                  isSubActive ? "bg-foreground" : "bg-muted-foreground",
                )}
              />
              <Tooltip group="sidebar-link" placement="right">
                {subLink.label}
              </Tooltip>
            </Link>
          );
        })}
      </div>
    );
  }

  return (
    <div className="relative flex flex-col gap-1">
      <span className="absolute top-8 left-5 h-6 w-px bg-border" />
      {TESTS_SUB_LINKS.map((subLink) => {
        const isSubActive = isTestsSubLinkActive(pathname, currentTab, subLink);

        return (
          <Link
            aria-current={isSubActive ? "page" : undefined}
            className={classNames(
              "relative flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-hover-overlay",
              isSubActive && "bg-muted",
            )}
            href={subLink.href}
            key={subLink.tab}
            scroll={false}
          >
            <span className="flex size-6 shrink-0 items-center justify-center">
              <span
                className={classNames(
                  "size-2 rounded-full",
                  isSubActive ? "bg-foreground" : "bg-muted-foreground",
                )}
              />
            </span>
            <span className="text-base font-normal text-foreground">
              {subLink.label}
            </span>
          </Link>
        );
      })}
    </div>
  );
}

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { logout, status, updateProfile, user } = useAuthSession();
  const isAuth = isAuthenticatedStatus(status);
  const isLoading = isLoadingStatus(status);
  const isAdmin = isAdminUser(user);
  const { collapsed, setCollapsed } = useSidebarCollapsed();
  const [testsExpanded, setTestsExpanded] = useState(() =>
    pathname.startsWith("/tests"),
  );

  const handleCollapsedSidebarClick = (event: MouseEvent<HTMLElement>) => {
    if ((event.target as HTMLElement).closest("a, button")) {
      return;
    }

    setCollapsed(false);
  };

  return (
    <aside
      className={classNames(
        "flex h-full shrink-0 flex-col bg-surface shadow-card backdrop-blur-md",
        collapsed && "cursor-ew-resize",
      )}
      onClick={collapsed ? handleCollapsedSidebarClick : undefined}
    >
      <div
        className={classNames(
          "flex min-h-0 flex-1 flex-col",
          collapsed ? "w-14" : "w-60",
        )}
      >
        <div className={classNames("flex flex-col gap-4 p-2", collapsed && "relative z-10")}>
          {collapsed ? (
            <div className="flex justify-center">
              <button
                type="button"
                aria-label="Open sidebar"
                onClick={() => {
                  setCollapsed(false);
                }}
                className={classNames(
                  sidebarOpenButtonClassName,
                  collapsed && "relative z-10",
                )}
              >
                <PanelOpenIcon />
                <Tooltip group="sidebar-toggle" placement="right">
                  Open sidebar
                </Tooltip>
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-2">
              <Link
                href="/"
                className="pl-2 text-base font-bold hover:opacity-80"
              >
                EngVocab
              </Link>
              <button
                type="button"
                aria-label="Close sidebar"
                onClick={() => {
                  setCollapsed(true);
                }}
                className={classNames(
                  sidebarCloseButtonClassName,
                  "relative z-10",
                )}
              >
                <PanelCloseIcon />
                <Tooltip group="sidebar-toggle" placement="bottom">
                  Close sidebar
                </Tooltip>
              </button>
            </div>
          )}

          {isLoading ? (
            <ShellNavSkeleton collapsed={collapsed} />
          ) : isAuth ? (
            <nav className="flex flex-col gap-2">
              <div className="flex flex-col gap-1">
                {APP_NAV_LINKS.map((link) => {
                  const isActive = isAppNavLinkActive(pathname, link);
                  const Icon = isActive ? link.activeIcon : link.icon;

                  if (link.activeMatch === "/tests") {
                    return (
                      <div
                        className={classNames(
                          "relative flex flex-col gap-1",
                          collapsed && "items-center",
                        )}
                        key={link.href}
                      >
                        {!collapsed && testsExpanded ? (
                          <span className="absolute left-5 top-8 h-6 w-px bg-border" />
                        ) : null}
                        <button
                          aria-expanded={testsExpanded}
                          aria-label={collapsed ? link.label : undefined}
                          className={classNames(
                            getAppSidebarLinkClass(pathname, link),
                            sidebarLinkGroupClassName,
                            "relative flex w-full cursor-pointer items-center gap-2 rounded-lg px-2 py-2 hover:bg-hover-overlay",
                            collapsed && "z-10 justify-center",
                          )}
                          onClick={() => setTestsExpanded((value) => !value)}
                          type="button"
                        >
                          <Icon className="size-6 shrink-0" />
                          {!collapsed ? (
                            <span className="flex-1 text-left">
                              {link.label}
                            </span>
                          ) : null}
                          {!collapsed ? (
                            <ArrowForwardIcon
                              className={classNames(
                                "size-4 shrink-0 text-muted-foreground",
                                testsExpanded && "rotate-90",
                              )}
                            />
                          ) : null}
                          {collapsed ? (
                            <Tooltip group="sidebar-link" placement="right">
                              {link.label}
                            </Tooltip>
                          ) : null}
                        </button>
                        <Suspense fallback={null}>
                          <TestsSubNav
                            collapsed={collapsed}
                            testsExpanded={testsExpanded}
                          />
                        </Suspense>
                      </div>
                    );
                  }

                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      aria-label={collapsed ? link.label : undefined}
                      className={classNames(
                        getAppSidebarLinkClass(pathname, link),
                        sidebarLinkGroupClassName,
                        "relative flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-hover-overlay",
                        collapsed && "z-10 justify-center",
                      )}
                    >
                      <Icon className="size-6 shrink-0" />
                      {!collapsed ? <span>{link.label}</span> : null}
                      {collapsed ? (
                        <Tooltip group="sidebar-link" placement="right">
                          {link.label}
                        </Tooltip>
                      ) : null}
                    </Link>
                  );
                })}
              </div>

              {isAdmin ? (
                <div className="border-t border-border pt-2">
                  {!collapsed ? (
                    <p className="px-2 pb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Admin
                    </p>
                  ) : null}
                  <div className="flex flex-col gap-1">
                    {ADMIN_NAV_LINKS.map((link) => {
                      const isActive = isAppNavLinkActive(pathname, link);
                      const Icon = isActive ? link.activeIcon : link.icon;

                      return (
                        <Link
                          key={link.href}
                          href={link.href}
                          aria-label={collapsed ? `Admin ${link.label}` : undefined}
                          className={classNames(
                            getAppSidebarLinkClass(pathname, link),
                            sidebarLinkGroupClassName,
                            "relative flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-hover-overlay",
                            collapsed && "z-10 justify-center",
                          )}
                        >
                          <Icon className="size-6 shrink-0" />
                          {!collapsed ? <span>{link.label}</span> : null}
                          {collapsed ? (
                            <Tooltip group="sidebar-link" placement="right">
                              Admin {link.label}
                            </Tooltip>
                          ) : null}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </nav>
          ) : null}
        </div>

        <div className={classNames("mt-auto p-2", collapsed && "relative z-10")}>
          {isLoading ? (
            <ShellAuthSlotSkeleton collapsed={collapsed} />
          ) : isAuth && user ? (
            <div className="flex flex-col gap-1">
              <SidebarThemeToggle collapsed={collapsed} />
              <SidebarUserMenu
                collapsed={collapsed}
                onUpdateProfile={updateProfile}
                user={user}
                onLogout={() => {
                  void logout();
                  router.replace("/login");
                }}
              />
            </div>
          ) : pathname !== "/login" ? (
            <Link
              href="/login"
              className={classNames(
                primaryTextButtonClassName(),
                collapsed ? "px-1 text-center text-xs" : "w-full text-center",
              )}
            >
              {collapsed ? "In" : "Sign in"}
            </Link>
          ) : null}
        </div>
      </div>
    </aside>
  );
}
