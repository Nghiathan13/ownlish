"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { AppSidebar } from "@/features/shell";
import { GuestTopNav } from "@/features/shell";
import { ImmersiveToolbar } from "@/features/shell";
import { MobileTopNav } from "@/features/shell";
import { useAuthSession } from "@/entities/session";
import { getShellLayoutMode } from "@/features/shell";
import { isImmersiveTestPath } from "@/entities/toeic-runtime";
import { classNames } from "@/shared/lib/classNames";

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const { status } = useAuthSession();
  const layoutMode = getShellLayoutMode(pathname);

  if (layoutMode === "bare") {
    return <>{children}</>;
  }

  if (layoutMode === "immersive") {
    return (
      <div
        className={classNames(
          "flex min-h-0 flex-1 flex-col",
          isImmersiveTestPath(pathname) && "bg-surface-subtle dark:bg-background",
        )}
      >
        <ImmersiveToolbar />
        {children}
      </div>
    );
  }

  if (status === "guest") {
    return (
      <div className="flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto">
        <GuestTopNav />
        {children}
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col sm:flex-row">
      <div className="hidden sm:flex">
        <AppSidebar />
      </div>
      <div
        className="flex min-h-0 min-w-0 flex-1 flex-col overflow-x-hidden overflow-y-auto sm:overflow-y-hidden"
        data-mobile-shell-scroll
      >
        <MobileTopNav />
        {children}
      </div>
    </div>
  );
}
