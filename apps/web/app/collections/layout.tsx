import type { ReactNode } from "react";
import { RequireAuth } from "@/features/auth";
import { CollectionsWorkspaceChrome } from "@/_pages/collections";

type CollectionsLayoutProps = {
  children: ReactNode;
};

export default function CollectionsLayout({ children }: CollectionsLayoutProps) {
  return (
    <RequireAuth>
      <CollectionsWorkspaceChrome>{children}</CollectionsWorkspaceChrome>
    </RequireAuth>
  );
}
