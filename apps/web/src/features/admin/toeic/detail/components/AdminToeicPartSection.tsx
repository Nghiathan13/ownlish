import type {
  AdminToeicTestRawGroup,
  AdminToeicTestRawPart,
} from "@/features/admin/toeic/api/types";
import { AdminToeicGroupPanel } from "@/features/admin/toeic/detail/components/AdminToeicGroupPanel";

type AdminToeicPartSectionProps = {
  part: AdminToeicTestRawPart;
  editingGroupId: number | null;
  onRequestEdit: (groupId: number) => void;
  onExitEdit: () => void;
  onDirtyChange: (groupId: number, isDirty: boolean) => void;
  onSaved: (updatedGroup: AdminToeicTestRawGroup) => void;
};

export function AdminToeicPartSection({
  part,
  editingGroupId,
  onRequestEdit,
  onExitEdit,
  onDirtyChange,
  onSaved,
}: AdminToeicPartSectionProps) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-xl font-semibold text-foreground">
        Part {part.partNumber}
      </h2>
      <div className="flex flex-col gap-4">
        {part.groups.map((group) => (
          <AdminToeicGroupPanel
            group={group}
            isEditing={editingGroupId === group.id}
            key={group.id}
            onDirtyChange={(isDirty) => onDirtyChange(group.id, isDirty)}
            onExitEdit={onExitEdit}
            onRequestEdit={() => onRequestEdit(group.id)}
            onSaved={onSaved}
          />
        ))}
      </div>
    </section>
  );
}
