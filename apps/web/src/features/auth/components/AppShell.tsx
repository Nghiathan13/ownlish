"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { AppSidebar } from "@/features/auth/components/AppSidebar";
import { MobileTopNav } from "@/features/auth/components/MobileTopNav";
import { TestSessionToolbar } from "@/features/auth/components/TestSessionToolbar";
import { isImmersiveTestPath } from "@/features/tests/shared/lib/isImmersiveTestPath";

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const isLogin = pathname === "/login";
  const isImmersiveTest = isImmersiveTestPath(pathname);

  if (isLogin) {
    return <>{children}</>;
  }

  if (isImmersiveTest) {
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
