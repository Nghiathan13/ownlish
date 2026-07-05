"use client";

import { useEffect, useRef, useState } from "react";
import type { AuthUser } from "@/entities/auth/types";
import { isAdminUser } from "@/features/auth/lib/isAdminUser";
import { classNames } from "@/shared/lib/classNames";
import { AccountIcon } from "@/shared/ui/icons/AccountIcon";
import { LogoutIcon } from "@/shared/ui/icons/LogoutIcon";
import { sidebarLinkGroupClassName, Tooltip } from "@/shared/ui/Tooltip";

type SidebarUserMenuProps = {
  collapsed: boolean;
  onLogout: () => void;
  user: AuthUser;
};

function getUserDisplayName(user: AuthUser) {
  const trimmedName = user.name?.trim();

  return trimmedName || user.email;
}

function AdminBadge() {
  return (
    <span className="rounded-md bg-muted px-1.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
      Admin
    </span>
  );
}

export function SidebarUserMenu({
  collapsed,
  onLogout,
  user,
}: SidebarUserMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const displayName = getUserDisplayName(user);
  const isAdmin = isAdminUser(user);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={collapsed ? "Account" : undefined}
        onClick={() => {
          setOpen((current) => !current);
        }}
        className={classNames(
          "flex w-full items-center rounded-lg px-2 py-2 text-foreground hover:bg-hover-overlay",
          collapsed ? "relative justify-center" : "gap-2",
          collapsed && sidebarLinkGroupClassName,
        )}
      >
        <AccountIcon className="size-6 shrink-0" />
        {!collapsed ? (
          <span className="flex min-w-0 items-center gap-2 truncate text-base font-normal">
            <span className="truncate">{displayName}</span>
            {isAdmin ? <AdminBadge /> : null}
          </span>
        ) : null}
        {collapsed ? (
          <Tooltip group="sidebar-link" placement="right">
            Account
          </Tooltip>
        ) : null}
      </button>

      {open ? (
        <div
          role="menu"
          onClick={(event) => {
            event.stopPropagation();
          }}
          className={classNames(
            "absolute bottom-full left-0 z-50 mb-2 min-w-56 cursor-default rounded-2xl border border-border bg-surface p-2 shadow-lg",
            !collapsed && "right-0",
          )}
        >
          <div className="flex items-center gap-2 p-2">
            <AccountIcon className="size-6 shrink-0" />
            <div className="min-w-0">
              <p className="flex min-w-0 items-center gap-2 truncate text-base font-normal text-foreground">
                <span className="truncate">{displayName}</span>
                {isAdmin ? <AdminBadge /> : null}
              </p>
              <p className="truncate text-sm text-muted-foreground">
                {user.email}
              </p>
            </div>
          </div>

          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onLogout();
            }}
            className="flex w-full items-center gap-2 rounded-lg p-2 text-base font-normal text-foreground hover:bg-hover-overlay"
          >
            <LogoutIcon className="size-6 shrink-0" />
            Logout
          </button>
        </div>
      ) : null}
    </div>
  );
}
