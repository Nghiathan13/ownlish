import type { AdminToeicTestRawGroup } from "@/features/admin/toeic/api/types";
import { AdminToeicMediaPreview } from "@/features/admin/toeic/detail/components/AdminToeicMediaPreview";

type AdminToeicGroupRawPanelProps = {
  group: AdminToeicTestRawGroup;
};

export function AdminToeicGroupRawPanel({ group }: AdminToeicGroupRawPanelProps) {
  return (
    <div className="flex flex-col gap-4">
      {(group.groupType || group.accent) && (
        <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {group.groupType ? <span>{group.groupType}</span> : null}
          {group.accent ? <span>{group.accent}</span> : null}
        </div>
      )}

      {group.content ? (
        <p className="whitespace-pre-wrap text-sm text-foreground">
          {group.content}
        </p>
      ) : null}
      {group.contentVi ? (
        <p className="whitespace-pre-wrap text-sm text-muted-foreground">
          {group.contentVi}
        </p>
      ) : null}

      <AdminToeicMediaPreview
        audioUrl={group.audioUrl}
        imageUrl={group.imageUrl}
      />
    </div>
  );
}
