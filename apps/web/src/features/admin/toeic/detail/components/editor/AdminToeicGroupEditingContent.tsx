"use client";

import { useMemo, useState } from "react";
import type { AdminToeicTestRawGroup } from "@/features/admin/toeic/api/types";
import { AdminToeicSplitLayout } from "@/features/admin/toeic/detail/components/AdminToeicSplitLayout";
import {
  AdminToeicGroupFieldsSection,
  AdminToeicQuestionFieldsSection,
} from "@/features/admin/toeic/detail/components/editor/AdminToeicGroupEditorFields";
import { AdminConfirmDialog } from "@/features/admin/toeic/detail/components/editor/AdminConfirmDialog";
import { AdminToeicMediaPreview } from "@/features/admin/toeic/detail/components/AdminToeicMediaPreview";
import { useAdminGroupEditor } from "@/features/admin/toeic/detail/hooks/useAdminGroupEditor";
import type { AdminToeicRunStep } from "@/features/admin/toeic/detail/lib/adminToeicRunSteps";
import { getAdminStepQuestions } from "@/features/admin/toeic/detail/lib/adminToeicRunSteps";
import { getPartPracticeConfig } from "@/features/tests/shared/lib/partPracticeConfig";

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
  const [isDeleteImageConfirmOpen, setIsDeleteImageConfirmOpen] = useState(false);
  const visibleQuestionIds = useMemo(
    () => new Set(getAdminStepQuestions(step).map((question) => question.id)),
    [step],
  );
  const visibleQuestions = editor.draft.questions.filter((question) =>
    visibleQuestionIds.has(question.id),
  );
  const partConfig = getPartPracticeConfig(step.partNumber);
  const questionNumber =
    getAdminStepQuestions(step)[0]?.questionNumber ?? group.questionStart;
  const showAudio =
    partConfig.leftPanel === "audio-image" ||
    partConfig.leftPanel === "audio" ||
    partConfig.leftPanel === "listening-group";
  const showImage =
    partConfig.leftPanel === "audio-image" ||
    partConfig.leftPanel === "listening-group";
  const canDeleteImage = showImage && group.imageUrl != null;

  const handleConfirmDeleteImage = async () => {
    const { error } = await editor.deleteImage();

    if (!error) {
      setIsDeleteImageConfirmOpen(false);
    }
  };

  return (
    <>
      <div className="flex min-h-0 flex-1 flex-col gap-4">
        <AdminToeicSplitLayout
          left={
            <>
              <AdminToeicMediaPreview
                audioUrl={group.audioUrl}
                imageUrl={group.imageUrl}
                onRequestDeleteImage={
                  canDeleteImage
                    ? () => setIsDeleteImageConfirmOpen(true)
                    : undefined
                }
                questionNumber={questionNumber}
                showAudio={showAudio}
                showImage={showImage}
                showImagePlaceholder={partConfig.leftPanel === "audio-image"}
              />
              <AdminToeicGroupFieldsSection
                draft={editor.draft}
                onChange={editor.setDraft}
                partNumber={step.partNumber}
              />
            </>
          }
          right={
            <AdminToeicQuestionFieldsSection
              draft={editor.draft}
              onChange={editor.setDraft}
              partNumber={step.partNumber}
              questions={visibleQuestions}
            />
          }
        />

        {editor.error ? (
          <p className="text-sm text-muted-foreground">{editor.error}</p>
        ) : null}
      </div>

      {isDeleteImageConfirmOpen ? (
        <AdminConfirmDialog
          cancelLabel="Cancel"
          confirmLabel={editor.isDeletingImage ? "Deleting…" : "Delete"}
          description="This image will be removed from storage. This cannot be undone."
          isConfirming={editor.isDeletingImage}
          onClose={() => {
            if (!editor.isDeletingImage) {
              setIsDeleteImageConfirmOpen(false);
            }
          }}
          onConfirm={handleConfirmDeleteImage}
          title="Delete image?"
        />
      ) : null}
    </>
  );
}
