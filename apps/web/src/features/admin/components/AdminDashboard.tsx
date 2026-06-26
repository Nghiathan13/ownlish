import Link from "next/link";
import { PageShell } from "@/shared/ui/PageShell";
import { Panel } from "@/shared/ui/Panel";
import { iconTextButtonClassName } from "@/shared/ui/button";

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

function AdminToeicContentCard() {
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border p-4">
      <div>
        <h2 className="text-lg font-semibold text-foreground">TOEIC Content</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Browse imported TOEIC tests, parts, groups, and questions.
        </p>
      </div>
      <Link
        className={iconTextButtonClassName(
          "w-full border-foreground bg-foreground text-background",
        )}
        href="/admin/toeic"
      >
        Open
      </Link>
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
            <AdminPlaceholderCard title="Users" />
            <AdminPlaceholderCard title="Vocabulary Content" />
            <AdminToeicContentCard />
          </div>
        </div>
      </Panel>
    </PageShell>
  );
}
