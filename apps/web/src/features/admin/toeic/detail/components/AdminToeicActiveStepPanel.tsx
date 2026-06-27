"use client";

import type { AdminToeicTestRawGroup } from "@/features/admin/toeic/api/types";
import { AdminToeicStepView } from "@/features/admin/toeic/detail/components/AdminToeicStepView";
import { AdminToeicGroupEditingContent } from "@/features/admin/toeic/detail/components/editor/AdminToeicGroupEditingContent";
import { useAdminGroupEditor } from "@/features/admin/toeic/detail/hooks/useAdminGroupEditor";
import type { AdminToeicRunStep } from "@/features/admin/toeic/detail/lib/adminToeicRunSteps";

type AdminToeicActiveStepPanelProps = {
  editor: ReturnType<typeof useAdminGroupEditor>;
  group: AdminToeicTestRawGroup;
  isEditing: boolean;
  step: AdminToeicRunStep;
};

export function AdminToeicActiveStepPanel({
  editor,
  group,
  isEditing,
  step,
}: AdminToeicActiveStepPanelProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {isEditing ? (
        <AdminToeicGroupEditingContent
          editor={editor}
          group={group}
          step={step}
        />
      ) : (
        <AdminToeicStepView step={step} />
      )}
    </div>
  );
}
