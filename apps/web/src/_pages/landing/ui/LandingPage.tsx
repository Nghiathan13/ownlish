"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  isAuthenticatedStatus,
  isLoadingStatus,
  useAuthSession,
} from "@/entities/session";
import { GuestLanding } from "./GuestLanding";
import { DASHBOARD_MY_ACTIVITY_PATH } from "@/shared/routes";
import { SessionLoadingSkeleton } from "@/shared/skeletons";
import { PageShell } from "@/shared/ui/PageShell";

export function LandingPage() {
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
