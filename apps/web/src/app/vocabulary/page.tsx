"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuthSession } from "@/features/auth/hooks/useAuthSession";
import { Button } from "@/shared/ui/Button";
import { Panel } from "@/shared/ui/Panel";
import { PageShell } from "@/shared/ui/PageShell";

export default function VocabularyPage() {
  const router = useRouter();
  const { clearSession, status, user } = useAuthSession();

  useEffect(() => {
    if (status === "guest") {
      router.replace("/login");
    }
  }, [router, status]);

  if (status === "checking") {
    return (
      <PageShell>
        <Panel>
          <p className="text-muted-foreground">Checking your session...</p>
        </Panel>
      </PageShell>
    );
  }

  if (status === "guest") {
    return null;
  }

  return (
    <PageShell>
      <Panel>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Vocabulary
            </p>
            <h1 className="mb-3 text-3xl font-bold leading-tight">
              Your vocabulary
            </h1>
            <p className="text-muted-foreground">{user?.email}</p>
          </div>
          <Button type="button" onClick={clearSession}>
            Logout
          </Button>
        </div>

        <div className="mt-8">
          <h2 className="mb-2 text-xl font-semibold">
            Vocabulary list comes next.
          </h2>
          <p className="text-muted-foreground">
            Auth is connected. The next step is loading words from the backend.
          </p>
          <Link
            href="/"
            className="mt-4 inline-flex text-sm font-semibold text-foreground underline underline-offset-4"
          >
            Back home
          </Link>
        </div>
      </Panel>
    </PageShell>
  );
}
