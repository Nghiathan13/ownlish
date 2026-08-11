"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { isLoadingStatus } from "../lib/authStatus";
import { useAuthSession } from "../model/authSessionContext";
import { SessionLoadingSkeleton } from "@/shared/skeletons";

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
    return <SessionLoadingSkeleton />;
  }

  if (status === "guest") {
    return null;
  }

  return children;
}
