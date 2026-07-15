"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { ImmersiveToolbar } from "@/features/shell/components/ImmersiveToolbar";
import { AppSidebar } from "@/features/shell/components/AppSidebar";
import { GuestTopNav } from "@/features/shell/components/GuestTopNav";
import { MobileTopNav } from "@/features/shell/components/MobileTopNav";
import {
  isAuthenticatedStatus,
  useAuthSession,
} from "@/features/auth/hooks/useAuthSession";
import { getShellLayoutMode } from "@/features/shell/lib/shellRoutes";

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
      <div className="flex min-h-0 flex-1 flex-col">
        <ImmersiveToolbar />
        {children}
      </div>
    );
  }

  if (pathname === "/" && !isAuthenticatedStatus(status)) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <GuestTopNav />
        {children}
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
      <div className="hidden lg:flex">
        <AppSidebar />
      </div>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <div className="lg:hidden">
          <MobileTopNav />
        </div>
        {children}
      </div>
    </div>
  );
}
