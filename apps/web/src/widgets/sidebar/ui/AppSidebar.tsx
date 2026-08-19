"use client";

import { type MouseEvent } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LocaleToggle, ThemeToggle } from "@/features/appearance";
import {
  APP_NAV_LINKS,
  getAppSidebarLinkClass,
  isAppNavLinkActive,
  SidebarUserMenu,
} from "@/features/shell";
import {
  isAuthenticatedStatus,
  useAuthSession,
} from "@/entities/session";
import { classNames } from "@/shared/lib/classNames";
import { useT } from "@/shared/lib/providers";
import { DASHBOARD_MY_ACTIVITY_PATH } from "@/shared/routes";
import {
  iconOnlyButtonClassName,
  primaryTextButtonClassName,
} from "@/shared/ui/button";
import { LogoIcon } from "@/shared/ui/icons";
import { PanelCloseIcon } from "@/shared/ui/icons";
import { PanelOpenIcon } from "@/shared/ui/icons";
import {
  sidebarLinkGroupClassName,
  sidebarToggleGroupClassName,
  Tooltip,
} from "@/shared/ui/Tooltip";
import { useSidebarCollapsed } from "../model/useSidebarCollapsed";

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

const sidebarCollapseEdgeClassName = classNames(
  "absolute inset-y-0 right-0 z-30 w-4 translate-x-1/2 cursor-col-resize touch-none select-none",
  "before:absolute before:inset-y-0 before:left-1/2 before:w-px before:-translate-x-1/2 before:bg-border",
  "hover:before:bg-foreground",
);

export function AppSidebar() {
  const t = useT();
  const pathname = usePathname();
  const router = useRouter();
  const { logout, status, updateProfile, user } = useAuthSession();
  const isAuth = isAuthenticatedStatus(status);
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
        "relative z-20 flex h-full shrink-0 flex-col bg-background backdrop-blur-md",
        collapsed ? "cursor-ew-resize border-r border-border" : null,
      )}
      onClick={collapsed ? handleCollapsedSidebarClick : undefined}
    >
      {!collapsed ? (
        <button
          type="button"
          aria-label={t("shell.closeSidebar")}
          className={sidebarCollapseEdgeClassName}
          onClick={() => {
            setCollapsed(true);
          }}
        />
      ) : null}
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
                href={DASHBOARD_MY_ACTIVITY_PATH}
                className="flex items-center gap-2 pl-2 text-base font-bold hover:opacity-80"
              >
                <LogoIcon className="size-6 shrink-0" />
                Ownlish
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

          {isAuth ? (
            <nav className="flex flex-col gap-2">
              <div className="flex flex-col gap-1">
                {APP_NAV_LINKS.map((link) => {
                  const isActive = isAppNavLinkActive(pathname, link);
                  const Icon = isActive ? link.activeIcon : link.icon;
                  const label = t(link.labelKey);

                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      aria-label={collapsed ? label : undefined}
                      className={classNames(
                        getAppSidebarLinkClass(pathname, link),
                        sidebarLinkGroupClassName,
                        "relative flex items-center gap-2 rounded-lg px-2 py-2",
                        isActive && "!bg-transparent dark:!bg-transparent",
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

            </nav>
          ) : null}
        </div>

        <div className={classNames("mt-auto p-2", collapsed && "relative z-10")}>
          {isAuth && user ? (
            <div className="flex flex-col gap-1">
              <LocaleToggle collapsed={collapsed} variant="sidebar" />
              <ThemeToggle collapsed={collapsed} variant="sidebar" />
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
              <LocaleToggle collapsed={collapsed} variant="sidebar" />
              <ThemeToggle collapsed={collapsed} variant="sidebar" />
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
