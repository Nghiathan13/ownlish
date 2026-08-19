"use client";

import type { ReactNode } from "react";
import { RequireAuth } from "@/features/auth";
import { PageShell } from "@/shared/ui/PageShell";
import { DashboardTitleTabs } from "./DashboardTitleTabs";

type DashboardScreenProps = {
  children: ReactNode;
};

export function DashboardScreen({ children }: DashboardScreenProps) {
  return (
    <RequireAuth>
      <PageShell className="max-lg:overflow-y-auto" fillViewport>
        <DashboardTitleTabs />
        {children}
      </PageShell>
    </RequireAuth>
  );
}
