"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { SessionLoadingSkeleton } from "@/features/auth/components/SessionLoadingSkeleton";
import {
  isAuthenticatedStatus,
  isLoadingStatus,
  useAuthSession,
} from "@/features/auth/hooks/useAuthSession";
import { GuestLanding } from "@/features/home/components/GuestLanding";
import { DASHBOARD_MY_ACTIVITY_PATH } from "@/features/home/lib/dashboardPaths";
import { PageShell } from "@/shared/ui/PageShell";

export function HomePage() {
  const router = useRouter();
  const { status } = useAuthSession();

  useEffect(() => {
    if (isAuthenticatedStatus(status)) {
      router.replace(DASHBOARD_MY_ACTIVITY_PATH);
    }
  }, [router, status]);

  if (isLoadingStatus(status)) {
    return <SessionLoadingSkeleton centered />;
  }

  if (isAuthenticatedStatus(status)) {
    return <SessionLoadingSkeleton centered />;
  }

  return (
    <PageShell className="overflow-visible sm:overflow-x-visible sm:overflow-y-visible">
      <GuestLanding />
    </PageShell>
  );
}
