import { PageShell } from "@/shared/ui/PageShell";
import { Panel } from "@/shared/ui/Panel";

const PLACEHOLDER_CARDS = [
  "Users",
  "Vocabulary Content",
  "TOEIC Content",
] as const;

function AdminPlaceholderCard({ title }: { title: string }) {
  return (
    <div className="rounded-xl border border-border bg-muted/40 p-4">
      <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
        Coming soon
      </p>
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Admin tools for this area are not available yet.
      </p>
    </div>
  );
}

export function AdminDashboard() {
  return (
    <PageShell>
      <Panel>
        <div className="flex flex-col gap-6">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Admin
            </p>
            <h1 className="text-3xl font-bold leading-tight">Admin</h1>
            <p className="mt-2 text-muted-foreground">
              Platform administration tools will live here.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {PLACEHOLDER_CARDS.map((title) => (
              <AdminPlaceholderCard key={title} title={title} />
            ))}
          </div>
        </div>
      </Panel>
    </PageShell>
  );
}
