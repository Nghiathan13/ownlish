"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { Panel } from "@/shared/ui/Panel";
import { PageShell } from "@/shared/ui/PageShell";
import { useAuthSession, isLoadingStatus } from "../hooks/useAuthSession";

type RequireAuthProps = {
  children: ReactNode;
};

export function RequireAuth({ children }: RequireAuthProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { status } = useAuthSession();

  useEffect(() => {
    if (status === "guest") {
      const currentPath = `${pathname}${window.location.search}`;
      router.replace(`/login?redirect=${encodeURIComponent(currentPath)}`);
    }
  }, [pathname, router, status]);

  if (isLoadingStatus(status)) {
    return (
      <PageShell>
        <Panel>
          <p className="text-muted-foreground">Loading session...</p>
        </Panel>
      </PageShell>
    );
  }

  if (status === "guest") {
    return null;
  }

  return children;
}
