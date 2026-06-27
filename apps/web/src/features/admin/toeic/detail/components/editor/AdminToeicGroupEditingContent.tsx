"use client";

import { useMemo } from "react";
import type { AdminToeicTestRawGroup } from "@/features/admin/toeic/api/types";
import { AdminToeicSplitLayout } from "@/features/admin/toeic/detail/components/AdminToeicSplitLayout";
import {
  AdminToeicGroupFieldsSection,
  AdminToeicQuestionFieldsSection,
} from "@/features/admin/toeic/detail/components/editor/AdminToeicGroupEditorFields";
import { AdminToeicMediaPreview } from "@/features/admin/toeic/detail/components/AdminToeicMediaPreview";
import { useAdminGroupEditor } from "@/features/admin/toeic/detail/hooks/useAdminGroupEditor";
import type { AdminToeicRunStep } from "@/features/admin/toeic/detail/lib/adminToeicRunSteps";
import { getAdminStepQuestions } from "@/features/admin/toeic/detail/lib/adminToeicRunSteps";

type AdminToeicGroupEditingContentProps = {
  editor: ReturnType<typeof useAdminGroupEditor>;
  group: AdminToeicTestRawGroup;
  step: AdminToeicRunStep;
};

export function AdminToeicGroupEditingContent({
  editor,
  group,
  step,
}: AdminToeicGroupEditingContentProps) {
  const visibleQuestionIds = useMemo(
    () => new Set(getAdminStepQuestions(step).map((question) => question.id)),
    [step],
  );
  const visibleQuestions = editor.draft.questions.filter((question) =>
    visibleQuestionIds.has(question.id),
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <AdminToeicSplitLayout
        left={
          <>
            <AdminToeicMediaPreview
              audioUrl={group.audioUrl}
              imageUrl={group.imageUrl}
            />
            <AdminToeicGroupFieldsSection
              draft={editor.draft}
              onChange={editor.setDraft}
            />
          </>
        }
        right={
          <AdminToeicQuestionFieldsSection
            draft={editor.draft}
            onChange={editor.setDraft}
            questions={visibleQuestions}
          />
        }
      />

      {editor.error ? (
        <p className="text-sm text-muted-foreground">{editor.error}</p>
      ) : null}
    </div>
  );
}
