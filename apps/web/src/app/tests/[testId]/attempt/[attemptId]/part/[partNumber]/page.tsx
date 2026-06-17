"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { RequireAuth } from "@/features/auth/components/RequireAuth";

type FullTestPartRedirectPageProps = {
  params: Promise<{
    testId: string;
    attemptId: string;
    partNumber: string;
  }>;
};

export default function FullTestPartRedirectPage({
  params,
}: FullTestPartRedirectPageProps) {
  const resolved = use(params);
  const router = useRouter();
  const testId = resolved.testId;
  const attemptId = resolved.attemptId;

  useEffect(() => {
    router.replace(`/tests/${testId}/attempt/${attemptId}`);
  }, [attemptId, router, testId]);

  return (
    <RequireAuth>
      <p className="sr-only">Redirecting...</p>
    </RequireAuth>
  );
}
