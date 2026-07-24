"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { RequireAuth } from "@/features/auth/components/RequireAuth";
import { CollectionsPage } from "@/features/collections/list/components/CollectionsPage";

type CollectionsLayoutProps = {
  children: ReactNode;
};

export default function CollectionsLayout({ children }: CollectionsLayoutProps) {
  const pathname = usePathname();
  const isCollectionsWorkspace =
    pathname === "/collections/user" || pathname.startsWith("/collections/oxford/");

  return (
    <RequireAuth>
      {isCollectionsWorkspace ? <CollectionsPage /> : children}
    </RequireAuth>
  );
}
