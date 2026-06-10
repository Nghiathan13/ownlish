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
      </Panel>
    </PageShell>
  );
}
