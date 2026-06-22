"use client";

import type { ReactNode } from "react";
import { RequireAuth } from "@/features/auth/components/RequireAuth";

type CollectionsLayoutProps = {
  children: ReactNode;
};

export default function CollectionsLayout({ children }: CollectionsLayoutProps) {
  return <RequireAuth>{children}</RequireAuth>;
}
