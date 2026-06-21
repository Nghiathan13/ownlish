"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { AuthForm } from "@/features/auth/components/AuthForm";
import {
  useAuthSession,
  isAuthenticatedStatus,
  isLoadingStatus,
} from "@/features/auth/hooks/useAuthSession";
import { getSafeAuthRedirectPath } from "@/features/auth/lib/authRedirect";
import { classNames } from "@/shared/lib/classNames";
import { Panel } from "@/shared/ui/Panel";
import { PageShell } from "@/shared/ui/PageShell";
import { PANEL_CARD_CLASS } from "@/shared/ui/layout";

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginPageStatus />}>
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
    return <LoginPageStatus />;
  }

  return (
    <PageShell centered>
      <AuthForm redirectTo={redirectTo} />
    </PageShell>
  );
}

function LoginPageStatus() {
  return (
    <PageShell centered>
      <Panel className={classNames(PANEL_CARD_CLASS, "w-[min(420px,100%)]")}>
        <p className="text-muted-foreground">Loading session...</p>
      </Panel>
    </PageShell>
  );
}
