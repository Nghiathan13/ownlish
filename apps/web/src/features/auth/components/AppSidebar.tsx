"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  useAuthSession,
  isAuthenticatedStatus,
  isLoadingStatus,
} from "@/features/auth/hooks/useAuthSession";
import {
  APP_NAV_LINKS,
  getAppSidebarLinkClass,
} from "@/features/auth/lib/appNavLinks";
import { classNames } from "@/shared/lib/classNames";
import {
  iconOnlyButtonClassName,
  primaryTextButtonClassName,
  secondaryTextButtonClassName,
} from "@/shared/ui/button";
import { PanelCloseIcon } from "@/shared/ui/icons/PanelCloseIcon";
import { PanelOpenIcon } from "@/shared/ui/icons/PanelOpenIcon";

const SIDEBAR_COLLAPSED_STORAGE_KEY = "engvocab.sidebar.collapsed";

export function AppSidebar() {
  const pathname = usePathname();
  const { logout, status, user } = useAuthSession();
  const isAuth = isAuthenticatedStatus(status);
  const [collapsed, setCollapsed] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(SIDEBAR_COLLAPSED_STORAGE_KEY);
    if (stored === "true") {
      setCollapsed(true);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    localStorage.setItem(SIDEBAR_COLLAPSED_STORAGE_KEY, String(collapsed));
  }, [collapsed, hydrated]);

  return (
    <aside
      className={classNames(
        "flex h-full shrink-0 flex-col border-r border-border bg-background/80 backdrop-blur-md",
        collapsed ? "w-16" : "w-56",
      )}
    >
      <div className="flex flex-col gap-6 p-4">
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
                "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <PanelOpenIcon className="size-5" />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-2">
            <Link href="/" className="text-base font-bold hover:opacity-80">
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
                "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <PanelCloseIcon className="size-5" />
            </button>
          </div>
        )}

        {isAuth ? (
          <nav className="flex flex-col gap-1">
            {APP_NAV_LINKS.map((link) => {
              const Icon = link.icon;

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  title={collapsed ? link.label : undefined}
                  aria-label={collapsed ? link.label : undefined}
                  className={classNames(
                    getAppSidebarLinkClass(pathname, link),
                    "flex items-center rounded-lg py-2 hover:bg-muted",
                    collapsed ? "justify-center px-2" : "gap-3 px-3",
                  )}
                >
                  <Icon className="size-5 shrink-0" />
                  {!collapsed ? <span>{link.label}</span> : null}
                </Link>
              );
            })}
          </nav>
        ) : null}
      </div>

      <div className="mt-auto border-t border-border p-4">
        {isLoadingStatus(status) ? null : isAuth ? (
          <div className="flex flex-col gap-3">
            {!collapsed ? (
              <span className="truncate text-xs text-muted-foreground">
                {user?.email}
              </span>
            ) : null}
            <button
              type="button"
              onClick={() => {
                void logout();
              }}
              className={classNames(
                secondaryTextButtonClassName(),
                collapsed ? "px-1 text-xs" : "w-full",
              )}
            >
              Logout
            </button>
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
    </aside>
  );
}
