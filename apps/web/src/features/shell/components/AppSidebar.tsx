"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  useAuthSession,
  isAuthenticatedStatus,
  isLoadingStatus,
} from "@/features/auth/hooks/useAuthSession";
import { isAdminUser } from "@/features/auth/lib/isAdminUser";
import { SidebarUserMenu } from "@/features/shell/components/SidebarUserMenu";
import { ShellAuthSlotSkeleton } from "@/features/shell/components/ShellAuthSlotSkeleton";
import { ShellNavSkeleton } from "@/features/shell/components/ShellNavSkeleton";
import { useSidebarCollapsed } from "@/features/shell/hooks/useSidebarCollapsed";
import {
  ADMIN_NAV_LINKS,
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
  const isLoading = isLoadingStatus(status);
  const isAdmin = isAdminUser(user);
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

          {isLoading ? (
            <ShellNavSkeleton collapsed={collapsed} />
          ) : isAuth ? (
            <nav className="flex flex-col gap-2">
              <div className="flex flex-col gap-1">
                {APP_NAV_LINKS.map((link) => {
                  const isActive = isAppNavLinkActive(pathname, link);
                  const Icon = isActive ? link.activeIcon : link.icon;

                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      aria-label={collapsed ? link.label : undefined}
                      className={classNames(
                        getAppSidebarLinkClass(pathname, link),
                        "group/sidebar-link relative flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-muted",
                        collapsed && "justify-center",
                      )}
                    >
                      <Icon className="size-6 shrink-0" />
                      {!collapsed ? <span>{link.label}</span> : null}
                      {collapsed ? (
                        <span
                          aria-hidden
                          className="pointer-events-none absolute left-full top-1/2 z-50 ml-2 hidden -translate-y-1/2 whitespace-nowrap rounded-md border border-border bg-background px-2 py-1 text-sm font-normal text-foreground shadow-lg group-hover/sidebar-link:block group-focus-visible/sidebar-link:block"
                        >
                          {link.label}
                        </span>
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
                            "group/sidebar-link relative flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-muted",
                            collapsed && "justify-center",
                          )}
                        >
                          <Icon className="size-6 shrink-0" />
                          {!collapsed ? <span>{link.label}</span> : null}
                          {collapsed ? (
                            <span
                              aria-hidden
                              className="pointer-events-none absolute left-full top-1/2 z-50 ml-2 hidden -translate-y-1/2 whitespace-nowrap rounded-md border border-border bg-background px-2 py-1 text-sm font-normal text-foreground shadow-lg group-hover/sidebar-link:block group-focus-visible/sidebar-link:block"
                            >
                              Admin {link.label}
                            </span>
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

        <div className="mt-auto border-t border-border p-2">
          {isLoading ? (
            <ShellAuthSlotSkeleton collapsed={collapsed} />
          ) : isAuth && user ? (
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
