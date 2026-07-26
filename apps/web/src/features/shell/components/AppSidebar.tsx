"use client";

import { Suspense, useState, type FocusEvent, type MouseEvent } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  useAuthSession,
  isAuthenticatedStatus,
  isLoadingStatus,
} from "@/features/auth/hooks/useAuthSession";
import { isAdminUser } from "@/features/auth/lib/isAdminUser";
import { SidebarLocaleToggle } from "@/features/shell/components/SidebarLocaleToggle";
import { SidebarUserMenu } from "@/features/shell/components/SidebarUserMenu";
import { SidebarThemeToggle } from "@/features/shell/components/SidebarThemeToggle";
import { ShellAuthSlotSkeleton } from "@/features/shell/components/ShellAuthSlotSkeleton";
import { ShellNavSkeleton } from "@/features/shell/components/ShellNavSkeleton";
import { useSidebarCollapsed } from "@/features/shell/hooks/useSidebarCollapsed";
import {
  ADMIN_NAV_LINKS,
  APP_NAV_LINKS,
  type AppNavLink,
  getAppSidebarLinkClass,
  isAppNavLinkActive,
  isTestsSubLinkActive,
  TESTS_SUB_LINKS,
} from "@/features/shell/lib/appNavLinks";
import { parseTestsOverviewTab } from "@/features/tests/shared/lib/partPracticePaths";
import { classNames } from "@/shared/lib/classNames";
import { useT } from "@/shared/providers/LocaleProvider";
import {
  iconOnlyButtonClassName,
  primaryTextButtonClassName,
} from "@/shared/ui/button";
import { DownIcon } from "@/shared/ui/icons/DownIcon";
import { UpIcon } from "@/shared/ui/icons/UpIcon";
import { LogoIcon } from "@/shared/ui/icons/LogoIcon";
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

const TESTS_TREE_RADIUS_PX = 12;
const TESTS_TREE_ITEM_HEIGHT_PX = 40;
const TESTS_TREE_ITEM_GAP_PX = 4;
const TESTS_TREE_TRUNK_X_PX = 12;
const TESTS_TREE_WIDTH_PX = TESTS_TREE_TRUNK_X_PX + TESTS_TREE_RADIUS_PX;

type TestsNavDropdownProps = {
  collapsed: boolean;
  link: AppNavLink;
};

function TestsNavDropdown({ collapsed, link }: TestsNavDropdownProps) {
  const t = useT();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentTab = parseTestsOverviewTab(searchParams.get("tab"));
  const [open, setOpen] = useState(false);
  const isActive = isAppNavLinkActive(pathname, link);
  const Icon = isActive ? link.activeIcon : link.icon;
  const label = t(link.labelKey);

  function handleBlurCapture(event: FocusEvent<HTMLDivElement>) {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      setOpen(false);
    }
  }

  return (
    <div
      className={classNames("relative", collapsed && "flex justify-center")}
      onBlurCapture={handleBlurCapture}
      onFocusCapture={() => setOpen(true)}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={collapsed ? label : undefined}
        className={classNames(
          getAppSidebarLinkClass(pathname, link),
          sidebarLinkGroupClassName,
          "relative flex w-full cursor-pointer items-center gap-2 rounded-lg px-2 py-2 hover:bg-hover-overlay",
          collapsed && "z-10 justify-center",
        )}
        type="button"
      >
        <Icon className="size-6 shrink-0" />
        {!collapsed ? <span className="flex-1 text-left">{label}</span> : null}
        {!collapsed ? (
          open ? (
            <UpIcon className="size-6 shrink-0 text-muted-foreground" />
          ) : (
            <DownIcon className="size-6 shrink-0 text-muted-foreground" />
          )
        ) : null}
        {collapsed && !open ? (
          <Tooltip group="sidebar-link" placement="right">
            {label}
          </Tooltip>
        ) : null}
      </button>

      {open ? (
        <div
          className={classNames(
            "absolute top-full z-50 pt-2",
            collapsed ? "left-0" : "left-0 right-0",
          )}
        >
          <div
            className={classNames(
              "cursor-default rounded-2xl border border-surface bg-surface p-2 shadow-card dark:border-border",
              collapsed ? "min-w-56" : "min-w-56 w-full",
            )}
            onClick={(event) => event.stopPropagation()}
            role="menu"
          >
            <div className="flex">
              <div
                aria-hidden
                className="relative shrink-0 text-foreground"
                style={{
                  height:
                    TESTS_TREE_ITEM_HEIGHT_PX * TESTS_SUB_LINKS.length +
                    TESTS_TREE_ITEM_GAP_PX * (TESTS_SUB_LINKS.length - 1),
                  width: TESTS_TREE_WIDTH_PX,
                }}
              >
                <svg
                  className="absolute inset-0 overflow-visible"
                  fill="none"
                  height={
                    TESTS_TREE_ITEM_HEIGHT_PX * TESTS_SUB_LINKS.length +
                    TESTS_TREE_ITEM_GAP_PX * (TESTS_SUB_LINKS.length - 1)
                  }
                  width={TESTS_TREE_WIDTH_PX}
                >
                  <path
                    d={`M ${TESTS_TREE_TRUNK_X_PX} 0 L ${TESTS_TREE_TRUNK_X_PX} ${
                      (TESTS_SUB_LINKS.length - 1) *
                        (TESTS_TREE_ITEM_HEIGHT_PX + TESTS_TREE_ITEM_GAP_PX) +
                      TESTS_TREE_ITEM_HEIGHT_PX / 2 -
                      TESTS_TREE_RADIUS_PX
                    }`}
                    stroke="currentColor"
                    strokeWidth={1}
                  />
                  {TESTS_SUB_LINKS.map((subLink, index) => {
                    const centerY =
                      index *
                        (TESTS_TREE_ITEM_HEIGHT_PX + TESTS_TREE_ITEM_GAP_PX) +
                      TESTS_TREE_ITEM_HEIGHT_PX / 2;

                    return (
                      <path
                        d={`M ${TESTS_TREE_TRUNK_X_PX} ${centerY - TESTS_TREE_RADIUS_PX} A ${TESTS_TREE_RADIUS_PX} ${TESTS_TREE_RADIUS_PX} 0 0 0 ${TESTS_TREE_TRUNK_X_PX + TESTS_TREE_RADIUS_PX} ${centerY}`}
                        key={`${subLink.tab}-branch`}
                        stroke="currentColor"
                        strokeWidth={1}
                      />
                    );
                  })}
                </svg>
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                {TESTS_SUB_LINKS.map((subLink) => {
                  const isSubActive = isTestsSubLinkActive(
                    pathname,
                    currentTab,
                    subLink,
                  );

                  return (
                    <Link
                      aria-current={isSubActive ? "page" : undefined}
                      className={classNames(
                        "flex h-10 w-full cursor-pointer items-center rounded-lg p-2 text-base font-normal text-foreground hover:bg-hover-overlay",
                        isSubActive && "bg-muted",
                      )}
                      href={subLink.href}
                      key={subLink.tab}
                      onClick={() => setOpen(false)}
                      role="menuitem"
                      scroll={false}
                    >
                      {t(subLink.labelKey)}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function AppSidebar() {
  const t = useT();
  const pathname = usePathname();
  const router = useRouter();
  const { logout, status, updateProfile, user } = useAuthSession();
  const isAuth = isAuthenticatedStatus(status);
  const isLoading = isLoadingStatus(status);
  const isAdmin = isAdminUser(user);
  const { collapsed, setCollapsed } = useSidebarCollapsed();

  const handleCollapsedSidebarClick = (event: MouseEvent<HTMLElement>) => {
    if ((event.target as HTMLElement).closest("a, button")) {
      return;
    }

    setCollapsed(false);
  };

  return (
    <aside
      className={classNames(
        "relative z-20 flex h-full shrink-0 flex-col bg-surface shadow-card backdrop-blur-md dark:border-r dark:border-border",
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
                aria-label={t("shell.openSidebar")}
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
                  {t("shell.openSidebar")}
                </Tooltip>
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-2">
              <Link
                href="/"
                className="flex items-center gap-2 pl-2 text-base font-bold hover:opacity-80"
              >
                <LogoIcon className="size-6 shrink-0" />
                EngVocab
              </Link>
              <button
                type="button"
                aria-label={t("shell.closeSidebar")}
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
                  {t("shell.closeSidebar")}
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
                  const label = t(link.labelKey);

                  if (link.activeMatch === "/tests") {
                    return (
                      <Suspense fallback={null} key={link.href}>
                        <TestsNavDropdown collapsed={collapsed} link={link} />
                      </Suspense>
                    );
                  }

                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      aria-label={collapsed ? label : undefined}
                      className={classNames(
                        getAppSidebarLinkClass(pathname, link),
                        sidebarLinkGroupClassName,
                        "relative flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-hover-overlay",
                        collapsed && "z-10 justify-center",
                      )}
                    >
                      <Icon className="size-6 shrink-0" />
                      {!collapsed ? <span>{label}</span> : null}
                      {collapsed ? (
                        <Tooltip group="sidebar-link" placement="right">
                          {label}
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
                      {t("shell.admin")}
                    </p>
                  ) : null}
                  <div className="flex flex-col gap-1">
                    {ADMIN_NAV_LINKS.map((link) => {
                      const isActive = isAppNavLinkActive(pathname, link);
                      const Icon = isActive ? link.activeIcon : link.icon;
                      const label = t(link.labelKey);
                      const adminLabel = `${t("shell.admin")} ${label}`;

                      return (
                        <Link
                          key={link.href}
                          href={link.href}
                          aria-label={collapsed ? adminLabel : undefined}
                          className={classNames(
                            getAppSidebarLinkClass(pathname, link),
                            sidebarLinkGroupClassName,
                            "relative flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-hover-overlay",
                            collapsed && "z-10 justify-center",
                          )}
                        >
                          <Icon className="size-6 shrink-0" />
                          {!collapsed ? <span>{label}</span> : null}
                          {collapsed ? (
                            <Tooltip group="sidebar-link" placement="right">
                              {adminLabel}
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
              <SidebarLocaleToggle collapsed={collapsed} />
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
            <div className="flex flex-col gap-1">
              <SidebarLocaleToggle collapsed={collapsed} />
              <SidebarThemeToggle collapsed={collapsed} />
              <Link
                href="/login"
                className={classNames(
                  primaryTextButtonClassName(),
                  collapsed ? "px-1 text-center text-xs" : "w-full text-center",
                )}
              >
                {collapsed ? t("auth.signInShort") : t("auth.signIn")}
              </Link>
            </div>
          ) : null}
        </div>
      </div>
    </aside>
  );
}
