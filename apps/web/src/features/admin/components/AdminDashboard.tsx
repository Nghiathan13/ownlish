import { PageShell } from "@/shared/ui/PageShell";
import { Panel } from "@/shared/ui/Panel";

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
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <AdminPlaceholderCard title="Users" />
            <AdminPlaceholderCard title="Vocabulary Content" />
          </div>
        </div>
      </Panel>
    </PageShell>
  );
}
