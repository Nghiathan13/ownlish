"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { SessionLoadingSkeleton } from "@/features/auth/components/SessionLoadingSkeleton";
import { isAdminUser } from "@/features/auth/lib/isAdminUser";
import { DASHBOARD_MY_ACTIVITY_PATH } from "@/features/home/lib/dashboardPaths";
import { useAuthSession, isLoadingStatus } from "../hooks/useAuthSession";
import { secondaryTextButtonClassName } from "@/shared/ui/button";
import { PageShell } from "@/shared/ui/PageShell";
import { Panel } from "@/shared/ui/Panel";

type RequireAdminProps = {
  children: ReactNode;
};

function AdminForbidden() {
  return (
    <PageShell>
      <Panel>
        <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Admin
        </p>
        <h1 className="mb-3 text-3xl font-bold leading-tight">Access denied</h1>
        <p className="mb-6 text-muted-foreground">
          You need admin privileges to view this page.
        </p>
        <Link
          className={secondaryTextButtonClassName()}
          href={DASHBOARD_MY_ACTIVITY_PATH}
        >
          Back to dashboard
        </Link>
      </Panel>
    </PageShell>
  );
}

export function RequireAdmin({ children }: RequireAdminProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { status, user } = useAuthSession();

  useEffect(() => {
    if (status === "guest") {
      const currentPath = `${pathname}${window.location.search}`;
      router.replace(`/login?redirect=${encodeURIComponent(currentPath)}`);
    }
  }, [pathname, router, status]);

  if (isLoadingStatus(status)) {
    return <SessionLoadingSkeleton />;
  }

  if (status === "guest") {
    return null;
  }

  if (!isAdminUser(user)) {
    return <AdminForbidden />;
  }

  return children;
}
