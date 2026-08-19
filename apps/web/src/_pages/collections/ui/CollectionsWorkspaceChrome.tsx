"use client";

import { Suspense, type ReactNode } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { parseOxfordBand } from "@/entities/collection";
import {
  CollectionCategorySelect,
  OxfordBandTabs,
} from "@/features/collections";
import { PageHeader } from "@/shared/ui/page-header";
import { PageShell } from "@/shared/ui/PageShell";

type CollectionsWorkspaceChromeProps = {
  children: ReactNode;
};

function OxfordCollectionsWorkspaceHeader() {
  const searchParams = useSearchParams();

  if (searchParams.get("group") != null) {
    return null;
  }

  const activeBand = parseOxfordBand(searchParams.get("band")) ?? "A1";

  return (
    <PageHeader className="flex flex-col gap-3 lg:gap-6">
      <CollectionCategorySelect activeCategory="oxford" />
      <OxfordBandTabs activeBand={activeBand} />
    </PageHeader>
  );
}

export function CollectionsWorkspaceChrome({
  children,
}: CollectionsWorkspaceChromeProps) {
  const pathname = usePathname();
  const isUserWorkspace = pathname === "/collections/user";
  const isOxfordWorkspace = pathname === "/collections/oxford";

  if (!isUserWorkspace && !isOxfordWorkspace) {
    return children;
  }

  return (
    <PageShell>
      {isOxfordWorkspace ? (
        <Suspense>
          <OxfordCollectionsWorkspaceHeader />
        </Suspense>
      ) : (
        <PageHeader>
          <CollectionCategorySelect activeCategory="user" />
        </PageHeader>
      )}
      {children}
    </PageShell>
  );
}
