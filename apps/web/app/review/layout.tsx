"use client";

import type { ReactNode } from "react";
import { RequireAuth } from "@/features/auth";
import { ReviewModeProvider } from "@/features/review";
import { ReviewCategoryTabs } from "@/_pages/review";
import { PageShell } from "@/shared/ui/PageShell";

type ReviewLayoutProps = {
  children: ReactNode;
};

export default function ReviewLayout({ children }: ReviewLayoutProps) {
  return (
    <RequireAuth>
      <ReviewModeProvider>
        <PageShell>
          <ReviewCategoryTabs />
          {children}
        </PageShell>
      </ReviewModeProvider>
    </RequireAuth>
  );
}
