"use client";

import type { ReactNode } from "react";
import { RequireAuth } from "@/features/auth/components/RequireAuth";
import { ReviewRouteWorkspace } from "@/features/review/components/ReviewRouteWorkspace";
import { ReviewModeProvider } from "@/features/review/hooks/useReviewMode";

type ReviewLayoutProps = {
  children: ReactNode;
};

export default function ReviewLayout({ children }: ReviewLayoutProps) {
  return (
    <RequireAuth>
      <ReviewModeProvider>
        <ReviewRouteWorkspace />
        {children}
      </ReviewModeProvider>
    </RequireAuth>
  );
}
