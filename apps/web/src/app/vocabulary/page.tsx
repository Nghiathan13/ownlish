"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuthSession } from "@/features/auth/hooks/useAuthSession";

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
      <main className="page">
        <section className="panel">
          <p className="muted">Checking your session...</p>
        </section>
      </main>
    );
  }

  if (status === "guest") {
    return null;
  }

  return (
    <main className="page">
      <section className="panel">
        <div className="page-header">
          <div>
            <p className="eyebrow">Vocabulary</p>
            <h1>Your vocabulary</h1>
            <p className="muted">{user?.email}</p>
          </div>
          <button type="button" onClick={clearSession}>
            Logout
          </button>
        </div>

        <div className="empty-state">
          <h2>Vocabulary list comes next.</h2>
          <p className="muted">
            Auth is connected. The next step is loading words from the backend.
          </p>
          <Link href="/">Back home</Link>
        </div>
      </section>
    </main>
  );
}
