"use client";

import type { ReactNode } from "react";
import { RequireAuth } from "@/features/auth";
import { ReviewModeProvider } from "@/features/review/hooks/useReviewMode";
import { ReviewWorkspacePage } from "@/_pages/review";

type ReviewLayoutProps = {
  children: ReactNode;
};

export default function ReviewLayout({ children }: ReviewLayoutProps) {
  return (
    <RequireAuth>
      <ReviewModeProvider>
        <ReviewWorkspacePage />
        {children}
      </ReviewModeProvider>
    </RequireAuth>
  );
}
