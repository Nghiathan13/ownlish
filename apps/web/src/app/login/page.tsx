"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { AuthForm } from "@/features/auth/components/AuthForm";
import { SessionLoadingSkeleton } from "@/features/auth/components/SessionLoadingSkeleton";
import {
  useAuthSession,
  isAuthenticatedStatus,
  isLoadingStatus,
} from "@/features/auth/hooks/useAuthSession";
import { getSafeAuthRedirectPath } from "@/features/auth/lib/authRedirect";
import { PageShell } from "@/shared/ui/PageShell";

export default function LoginPage() {
  return (
    <Suspense fallback={<SessionLoadingSkeleton centered />}>
      <LoginPageContent />
    </Suspense>
  );
}

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status } = useAuthSession();
  const redirectTo = getSafeAuthRedirectPath(searchParams.get("redirect"));

  useEffect(() => {
    if (isAuthenticatedStatus(status)) {
      router.replace(redirectTo);
    }
  }, [redirectTo, router, status]);

  if (isLoadingStatus(status) || isAuthenticatedStatus(status)) {
    return <SessionLoadingSkeleton centered />;
  }

  return (
    <PageShell centered>
      <AuthForm redirectTo={redirectTo} />
    </PageShell>
  );
}
