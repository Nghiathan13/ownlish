"use client";

import type { ReactNode } from "react";
import { RequireAuth } from "@/features/auth";
import { PageShell } from "@/shared/ui/PageShell";
import { TestTitleTabs } from "./TestTitleTabs";

type TestsScreenProps = {
  children: ReactNode;
};

export function TestsScreen({ children }: TestsScreenProps) {
  return (
    <RequireAuth>
      <PageShell>
        <TestTitleTabs />
        {children}
      </PageShell>
    </RequireAuth>
  );
}
