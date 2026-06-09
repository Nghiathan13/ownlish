"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { AuthForm } from "@/features/auth/components/AuthForm";
import { useAuthSession } from "@/features/auth/hooks/useAuthSession";
import { Panel } from "@/shared/ui/Panel";
import { PageShell } from "@/shared/ui/PageShell";

export default function LoginPage() {
  const router = useRouter();
  const { status } = useAuthSession();

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/vocabulary");
    }
  }, [router, status]);

  if (status === "checking" || status === "authenticated") {
    return (
      <PageShell centered>
        <Panel className="w-[min(420px,100%)]">
          <p className="text-muted-foreground">Checking your session...</p>
        </Panel>
      </PageShell>
    );
  }

  return (
    <PageShell centered>
      <AuthForm />
    </PageShell>
  );
}
