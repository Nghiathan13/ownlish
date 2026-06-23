"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  useAuthSession,
  isAuthenticatedStatus,
  isLoadingStatus,
} from "@/features/auth/hooks/useAuthSession";
import { SidebarUserMenu } from "@/features/shell/components/SidebarUserMenu";
import { useSidebarCollapsed } from "@/features/shell/hooks/useSidebarCollapsed";
import {
  APP_NAV_LINKS,
  getAppSidebarLinkClass,
  isAppNavLinkActive,
} from "@/features/shell/lib/appNavLinks";
import { classNames } from "@/shared/lib/classNames";
import {
  iconOnlyButtonClassName,
  primaryTextButtonClassName,
} from "@/shared/ui/button";
import { PanelCloseIcon } from "@/shared/ui/icons/PanelCloseIcon";
import { PanelOpenIcon } from "@/shared/ui/icons/PanelOpenIcon";

export function AppSidebar() {
  const pathname = usePathname();
  const { logout, status, user } = useAuthSession();
  const isAuth = isAuthenticatedStatus(status);
  const { collapsed, setCollapsed } = useSidebarCollapsed();

  return (
    <aside className="flex h-full shrink-0 flex-col border-r border-border bg-background/80 backdrop-blur-md">
      <div
        className={classNames(
          "flex min-h-0 flex-1 flex-col",
          collapsed ? "w-14" : "w-60",
        )}
      >
        <div className="flex flex-col gap-4 p-2">
          {collapsed ? (
            <div className="flex justify-center">
              <button
                type="button"
                aria-label="Expand sidebar"
                title="Expand sidebar"
                onClick={() => {
                  setCollapsed(false);
                }}
                className={classNames(
                  iconOnlyButtonClassName(),
                  "size-10 [&_svg]:size-6 text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <PanelOpenIcon />
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
                aria-label="Collapse sidebar"
                title="Collapse sidebar"
                onClick={() => {
                  setCollapsed(true);
                }}
                className={classNames(
                  iconOnlyButtonClassName(),
                  "size-10 [&_svg]:size-6 text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <PanelCloseIcon />
              </button>
            </div>
          )}

          {isAuth ? (
            <nav className="flex flex-col gap-1">
              {APP_NAV_LINKS.map((link) => {
                const isActive = isAppNavLinkActive(pathname, link);
                const Icon = isActive ? link.activeIcon : link.icon;

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    title={collapsed ? link.label : undefined}
                    aria-label={collapsed ? link.label : undefined}
                    className={classNames(
                      getAppSidebarLinkClass(pathname, link),
                      "flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-muted",
                      collapsed && "justify-center",
                    )}
                  >
                    <Icon className="size-6 shrink-0" />
                    {!collapsed ? <span>{link.label}</span> : null}
                  </Link>
                );
              })}
            </nav>
          ) : null}
        </div>

        <div className="mt-auto border-t border-border p-2">
          {isLoadingStatus(status) ? null : isAuth && user ? (
            <SidebarUserMenu
              collapsed={collapsed}
              user={user}
              onLogout={() => {
                void logout();
              }}
            />
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
