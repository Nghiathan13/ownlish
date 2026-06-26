"use client";

import { useEffect, useState } from "react";
import type { AdminToeicTestRawGroup } from "@/features/admin/toeic/api/types";
import { AdminToeicGroupView } from "@/features/admin/toeic/detail/components/AdminToeicGroupView";
import { AdminToeicGroupEditingContent } from "@/features/admin/toeic/detail/components/editor/AdminToeicGroupEditingContent";
import { secondaryTextButtonClassName } from "@/shared/ui/button";

type AdminToeicGroupPanelProps = {
  group: AdminToeicTestRawGroup;
  isEditing: boolean;
  onRequestEdit: () => void;
  onExitEdit: () => void;
  onDirtyChange: (isDirty: boolean) => void;
  onSaved: (updatedGroup: AdminToeicTestRawGroup) => void;
};

export function AdminToeicGroupPanel({
  group,
  isEditing,
  onRequestEdit,
  onExitEdit,
  onDirtyChange,
  onSaved,
}: AdminToeicGroupPanelProps) {
  const [savedMessage, setSavedMessage] = useState(false);

  useEffect(() => {
    if (!savedMessage) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setSavedMessage(false);
    }, 2500);

    return () => window.clearTimeout(timeoutId);
  }, [savedMessage]);

  return (
    <section className="rounded-xl border border-border p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">
            Q{group.questionStart}–{group.questionEnd}
          </span>
          {group.groupType ? <span>· {group.groupType}</span> : null}
          {group.accent ? <span>· {group.accent}</span> : null}
          {isEditing ? (
            <span className="rounded-full border border-border px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-foreground">
              Editing
            </span>
          ) : null}
          {savedMessage ? (
            <span className="text-xs font-medium text-foreground">Saved</span>
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
          onSaved={(updatedGroup) => {
            onSaved(updatedGroup);
            setSavedMessage(true);
          }}
        />
      ) : (
        <AdminToeicGroupView group={group} />
      )}
    </section>
  );
}
