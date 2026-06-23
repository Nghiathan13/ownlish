"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { TestSessionToolbar } from "@/features/tests/run/components/TestSessionToolbar";
import { AppSidebar } from "@/features/shell/components/AppSidebar";
import { MobileTopNav } from "@/features/shell/components/MobileTopNav";
import { getShellLayoutMode } from "@/features/shell/lib/shellRoutes";

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const layoutMode = getShellLayoutMode(pathname);

  if (layoutMode === "bare") {
    return <>{children}</>;
  }

  if (layoutMode === "immersive-test") {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <TestSessionToolbar />
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
