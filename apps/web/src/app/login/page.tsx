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
    <div className="flex min-h-0 flex-1">
      <div className="flex w-full items-center justify-center p-8 lg:w-[40%]">
        <AuthForm redirectTo={redirectTo} />
      </div>
      <div
        aria-hidden
        className="hidden lg:block w-[60%]"
        style={{
          background:
            "linear-gradient(rgb(2, 8, 13) 0%, rgb(25, 29, 193) 24%, rgb(41, 126, 232) 50%, rgb(234, 239, 252) 100%)",
        }}
      />
    </div>
  );
}
