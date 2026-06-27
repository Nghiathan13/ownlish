"use client";

import type { AdminToeicTestRawGroup } from "@/features/admin/toeic/api/types";
import { AdminToeicStepView } from "@/features/admin/toeic/detail/components/AdminToeicStepView";
import { AdminToeicGroupEditingContent } from "@/features/admin/toeic/detail/components/editor/AdminToeicGroupEditingContent";
import type { AdminToeicRunStep } from "@/features/admin/toeic/detail/lib/adminToeicRunSteps";
import { getAdminStepGroup } from "@/features/admin/toeic/detail/lib/adminToeicRunSteps";
import { secondaryTextButtonClassName } from "@/shared/ui/button";

type AdminToeicActiveStepPanelProps = {
  group: AdminToeicTestRawGroup;
  isEditing: boolean;
  onDirtyChange: (isDirty: boolean) => void;
  onExitEdit: () => void;
  onRequestEdit: () => void;
  onGroupPatched: (updatedGroup: AdminToeicTestRawGroup) => void;
  step: AdminToeicRunStep;
};

export function AdminToeicActiveStepPanel({
  group,
  isEditing,
  onDirtyChange,
  onExitEdit,
  onRequestEdit,
  onGroupPatched,
  step,
}: AdminToeicActiveStepPanelProps) {
  const stepGroup = getAdminStepGroup(step);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">
            Part {step.partNumber}
          </span>
          <span>
            · Q{stepGroup.questionStart}
            {stepGroup.questionEnd !== stepGroup.questionStart
              ? `–${stepGroup.questionEnd}`
              : ""}
          </span>
          {stepGroup.groupType ? <span>· {stepGroup.groupType}</span> : null}
          {stepGroup.accent ? <span>· {stepGroup.accent}</span> : null}
          {isEditing ? (
            <span className="rounded-full border border-border px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-foreground">
              Editing
            </span>
          ) : null}
        </div>

        {!isEditing ? (
          <button
            className={secondaryTextButtonClassName()}
            onClick={onRequestEdit}
            type="button"
          >
            Edit
          </button>
        ) : null}
      </div>

      {isEditing ? (
        <AdminToeicGroupEditingContent
          group={group}
          key={group.id}
          onDirtyChange={onDirtyChange}
          onExitEdit={onExitEdit}
          onGroupPatched={onGroupPatched}
          step={step}
        />
      ) : (
        <AdminToeicStepView step={step} />
      )}
    </div>
  );
}
