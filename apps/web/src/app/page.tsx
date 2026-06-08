import Link from "next/link";
import { Panel } from "@/shared/ui/Panel";
import { PageShell } from "@/shared/ui/PageShell";

export default function HomePage() {
  return (
    <PageShell>
      <Panel>
        <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
          EngVocab Web
        </p>
        <h1 className="mb-3 text-3xl font-bold leading-tight">
          Build and review your English vocabulary.
        </h1>
        <p className="text-muted-foreground">
          This web app is connected to the new EngVocab backend.
        </p>
        <div className="mt-6 flex gap-3">
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-lg border border-foreground bg-foreground px-3.5 py-2.5 text-sm font-semibold text-background no-underline"
          >
            Login
          </Link>
          <Link
            href="/vocabulary"
            className="inline-flex items-center justify-center rounded-lg border border-border bg-transparent px-3.5 py-2.5 text-sm font-semibold text-foreground no-underline hover:bg-muted"
          >
            Vocabulary
          </Link>
        </div>
      </Panel>
    </PageShell>
  );
}
