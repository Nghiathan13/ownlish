"use client";

import type { ReactNode } from "react";
import { RequireAuth } from "@/features/auth";
import { ReviewModeProvider } from "@/_pages/review";
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
