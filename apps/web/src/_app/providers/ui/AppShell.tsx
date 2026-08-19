"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import {
  getShellLayoutMode,
  GuestTopNav,
  ImmersiveToolbar,
} from "@/features/shell";
import { isLoadingStatus, useAuthSession } from "@/entities/session";
import { MobileTopNav } from "@/widgets/mobile-nav";
import { AppSidebar } from "@/widgets/sidebar";
import { isImmersiveTestPath } from "@/entities/toeic-runtime";
import { classNames } from "@/shared/lib/classNames";
import { SessionLoadingSkeleton } from "@/shared/skeletons";

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

  if (isLoadingStatus(status)) {
    return <SessionLoadingSkeleton />;
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
