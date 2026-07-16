"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthSession, isAuthenticatedStatus } from "@/features/auth/hooks/useAuthSession";

export function AuthQueryReset() {
  const { status, user } = useAuthSession();
  const queryClient = useQueryClient();
  const previousUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (isAuthenticatedStatus(status)) {
      const previousUserId = previousUserIdRef.current;
      const nextUserId = user?.id ?? null;

      if (previousUserId && nextUserId && previousUserId !== nextUserId) {
        queryClient.clear();
      }

      previousUserIdRef.current = nextUserId;
      return;
    }

    if (previousUserIdRef.current) {
      queryClient.clear();
      previousUserIdRef.current = null;
    }
  }, [queryClient, status, user?.id]);

  return null;
}
