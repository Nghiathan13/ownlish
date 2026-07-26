"use client";

import { type MouseEvent } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  useAuthSession,
  isAuthenticatedStatus,
  isLoadingStatus,
} from "@/features/auth/hooks/useAuthSession";
import { SidebarLocaleToggle } from "@/features/shell/components/SidebarLocaleToggle";
import { SidebarUserMenu } from "@/features/shell/components/SidebarUserMenu";
import { SidebarThemeToggle } from "@/features/shell/components/SidebarThemeToggle";
import { ShellAuthSlotSkeleton } from "@/features/shell/components/ShellAuthSlotSkeleton";
import { ShellNavSkeleton } from "@/features/shell/components/ShellNavSkeleton";
import { useSidebarCollapsed } from "@/features/shell/hooks/useSidebarCollapsed";
import {
  APP_NAV_LINKS,
  getAppSidebarLinkClass,
  isAppNavLinkActive,
} from "@/features/shell/lib/appNavLinks";
import { classNames } from "@/shared/lib/classNames";
import { useT } from "@/shared/providers/LocaleProvider";
import {
  iconOnlyButtonClassName,
  primaryTextButtonClassName,
} from "@/shared/ui/button";
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

export function AppSidebar() {
  const t = useT();
  const pathname = usePathname();
  const router = useRouter();
  const { logout, status, updateProfile, user } = useAuthSession();
  const isAuth = isAuthenticatedStatus(status);
  const isLoading = isLoadingStatus(status);
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

                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      aria-label={collapsed ? label : undefined}
                      className={classNames(
                        getAppSidebarLinkClass(pathname, link),
                        sidebarLinkGroupClassName,
                        "relative flex items-center gap-2 rounded-lg px-2 py-2",
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
