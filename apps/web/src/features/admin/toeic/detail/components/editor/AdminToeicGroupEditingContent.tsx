"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { AdminToeicTestRawGroup } from "@/features/admin/toeic/api/types";
import { AdminToeicSplitLayout } from "@/features/admin/toeic/detail/components/AdminToeicSplitLayout";
import {
  AdminToeicGroupFieldsSection,
  AdminToeicQuestionFieldsSection,
} from "@/features/admin/toeic/detail/components/editor/AdminToeicGroupEditorFields";
import { AdminConfirmDialog } from "@/features/admin/toeic/detail/components/editor/AdminConfirmDialog";
import { AdminToeicMediaPreview } from "@/features/admin/toeic/detail/components/AdminToeicMediaPreview";
import { useAdminGroupEditor } from "@/features/admin/toeic/detail/hooks/useAdminGroupEditor";
import { adminToeicGroupMayHaveAudio } from "@/features/admin/toeic/detail/lib/adminToeicGroupAudioEligibility";
import { adminToeicGroupMayHaveImage } from "@/features/admin/toeic/detail/lib/adminToeicGroupImageEligibility";
import type { AdminToeicRunStep } from "@/features/admin/toeic/detail/lib/adminToeicRunSteps";
import { getAdminStepQuestions } from "@/features/admin/toeic/detail/lib/adminToeicRunSteps";
import { getPartPracticeConfig } from "@/features/tests/shared/lib/partPracticeConfig";
import {
  primaryTextButtonClassName,
  secondaryTextButtonClassName,
  textButtonClassName,
} from "@/shared/ui/button";

type AdminToeicGroupEditingContentProps = {
  editor: ReturnType<typeof useAdminGroupEditor>;
  group: AdminToeicTestRawGroup;
  step: AdminToeicRunStep;
};

function isPngFile(file: File) {
  return file.type === "image/png" && file.name.toLowerCase().endsWith(".png");
}

function isMp3File(file: File) {
  return file.type === "audio/mpeg" && file.name.toLowerCase().endsWith(".mp3");
}

function uploadMediaButtonClassName() {
  return textButtonClassName(
    "border-emerald-700 bg-emerald-700 text-white enabled:hover:border-emerald-800 enabled:hover:bg-emerald-800 dark:border-emerald-500 dark:bg-emerald-600 dark:enabled:hover:border-emerald-400 dark:enabled:hover:bg-emerald-500",
  );
}

export function AdminToeicGroupEditingContent({
  editor,
  group,
  step,
}: AdminToeicGroupEditingContentProps) {
  const audioFileInputRef = useRef<HTMLInputElement>(null);
  const imageFileInputRef = useRef<HTMLInputElement>(null);
  const [isDeleteAudioConfirmOpen, setIsDeleteAudioConfirmOpen] = useState(false);
  const [isDeleteImageConfirmOpen, setIsDeleteImageConfirmOpen] = useState(false);
  const [pendingAudioFile, setPendingAudioFile] = useState<File | null>(null);
  const [pendingAudioPreviewUrl, setPendingAudioPreviewUrl] = useState<
    string | null
  >(null);
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null);
  const [pendingImagePreviewUrl, setPendingImagePreviewUrl] = useState<
    string | null
  >(null);
  const [audioUploadError, setAudioUploadError] = useState<string | null>(null);
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);

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
  const groupMayHaveAudio = adminToeicGroupMayHaveAudio(step.partNumber);
  const groupMayHaveImage = adminToeicGroupMayHaveImage(
    step.partNumber,
    group.questionStart,
    group.questionEnd,
  );
  const canUploadAudio =
    groupMayHaveAudio &&
    showAudio &&
    group.audioUrl == null &&
    pendingAudioFile == null;
  const canDeleteAudio =
    groupMayHaveAudio &&
    showAudio &&
    group.audioUrl != null &&
    pendingAudioFile == null;
  const canUploadImage =
    groupMayHaveImage && group.imageUrl == null && pendingImageFile == null;
  const canDeleteImage =
    groupMayHaveImage && group.imageUrl != null && pendingImageFile == null;
  const hasPendingAudioUpload = pendingAudioFile != null;
  const hasPendingImageUpload = pendingImageFile != null;
  const hasMediaControls = groupMayHaveAudio || groupMayHaveImage;

  useEffect(() => {
    return () => {
      if (pendingAudioPreviewUrl) {
        URL.revokeObjectURL(pendingAudioPreviewUrl);
      }
      if (pendingImagePreviewUrl) {
        URL.revokeObjectURL(pendingImagePreviewUrl);
      }
    };
  }, [pendingAudioPreviewUrl, pendingImagePreviewUrl]);

  const clearPendingAudioUpload = () => {
    if (pendingAudioPreviewUrl) {
      URL.revokeObjectURL(pendingAudioPreviewUrl);
    }

    setPendingAudioFile(null);
    setPendingAudioPreviewUrl(null);
    setAudioUploadError(null);

    if (audioFileInputRef.current) {
      audioFileInputRef.current.value = "";
    }
  };

  const clearPendingImageUpload = () => {
    if (pendingImagePreviewUrl) {
      URL.revokeObjectURL(pendingImagePreviewUrl);
    }

    setPendingImageFile(null);
    setPendingImagePreviewUrl(null);
    setImageUploadError(null);

    if (imageFileInputRef.current) {
      imageFileInputRef.current.value = "";
    }
  };

  const handleAudioFileSelected = (file: File | undefined) => {
    if (!file) {
      return;
    }

    if (!isMp3File(file)) {
      setAudioUploadError("Audio file must be a .mp3 file.");
      if (audioFileInputRef.current) {
        audioFileInputRef.current.value = "";
      }
      return;
    }

    if (pendingAudioPreviewUrl) {
      URL.revokeObjectURL(pendingAudioPreviewUrl);
    }

    setAudioUploadError(null);
    setPendingAudioFile(file);
    setPendingAudioPreviewUrl(URL.createObjectURL(file));
  };

  const handleImageFileSelected = (file: File | undefined) => {
    if (!file) {
      return;
    }

    if (!isPngFile(file)) {
      setImageUploadError("Image file must be a .png file.");
      if (imageFileInputRef.current) {
        imageFileInputRef.current.value = "";
      }
      return;
    }

    if (pendingImagePreviewUrl) {
      URL.revokeObjectURL(pendingImagePreviewUrl);
    }

    setImageUploadError(null);
    setPendingImageFile(file);
    setPendingImagePreviewUrl(URL.createObjectURL(file));
  };

  const handleConfirmDeleteAudio = async () => {
    const { error } = await editor.deleteAudio();

    if (!error) {
      setIsDeleteAudioConfirmOpen(false);
    }
  };

  const handleConfirmDeleteImage = async () => {
    const { error } = await editor.deleteImage();

    if (!error) {
      setIsDeleteImageConfirmOpen(false);
    }
  };

  const handleSavePendingAudio = async () => {
    if (!pendingAudioFile) {
      return;
    }

    const { error } = await editor.uploadAudio(pendingAudioFile);

    if (!error) {
      clearPendingAudioUpload();
    }
  };

  const handleSavePendingImage = async () => {
    if (!pendingImageFile) {
      return;
    }

    const { error } = await editor.uploadImage(pendingImageFile);

    if (!error) {
      clearPendingImageUpload();
    }
  };

  const uploadAudioSlot = canUploadAudio ? (
    <div className="flex justify-end">
      <button
        className={uploadMediaButtonClassName()}
        disabled={editor.isUploadingAudio}
        onClick={() => audioFileInputRef.current?.click()}
        type="button"
      >
        Upload audio
      </button>
      <input
        accept=".mp3,audio/mpeg"
        className="hidden"
        onChange={(event) => {
          handleAudioFileSelected(event.target.files?.[0]);
        }}
        ref={audioFileInputRef}
        type="file"
      />
    </div>
  ) : null;

  const uploadImageSlot = canUploadImage ? (
    <div className="flex justify-end">
      <button
        className={uploadMediaButtonClassName()}
        disabled={editor.isUploadingImage}
        onClick={() => imageFileInputRef.current?.click()}
        type="button"
      >
        Upload image
      </button>
      <input
        accept=".png,image/png"
        className="hidden"
        onChange={(event) => {
          handleImageFileSelected(event.target.files?.[0]);
        }}
        ref={imageFileInputRef}
        type="file"
      />
    </div>
  ) : null;

  const mediaPreview = (
    <AdminToeicMediaPreview
      afterAudioSlot={groupMayHaveImage ? uploadImageSlot : undefined}
      audioUrl={group.audioUrl}
      beforeAudioSlot={groupMayHaveAudio ? uploadAudioSlot : undefined}
      imageUrl={group.imageUrl}
      onRequestDeleteAudio={
        canDeleteAudio ? () => setIsDeleteAudioConfirmOpen(true) : undefined
      }
      onRequestDeleteImage={
        canDeleteImage ? () => setIsDeleteImageConfirmOpen(true) : undefined
      }
      previewAudioUrl={pendingAudioPreviewUrl}
      previewImageUrl={pendingImagePreviewUrl}
      questionNumber={questionNumber}
      showAudio={showAudio}
      showImage={showImage}
      showImagePlaceholder={partConfig.leftPanel === "audio-image"}
    />
  );

  return (
    <>
      <div className="flex min-h-0 flex-1 flex-col gap-4">
        <AdminToeicSplitLayout
          left={
            <>
              {hasMediaControls ? (
                <div className="flex flex-col gap-3">
                  {mediaPreview}

                  {hasPendingAudioUpload ? (
                    <div className="flex justify-end gap-2">
                      <button
                        className={secondaryTextButtonClassName()}
                        disabled={editor.isUploadingAudio}
                        onClick={clearPendingAudioUpload}
                        type="button"
                      >
                        Cancel
                      </button>
                      <button
                        className={primaryTextButtonClassName()}
                        disabled={editor.isUploadingAudio}
                        onClick={handleSavePendingAudio}
                        type="button"
                      >
                        {editor.isUploadingAudio ? "Saving…" : "Save"}
                      </button>
                    </div>
                  ) : null}

                  {hasPendingImageUpload ? (
                    <div className="flex justify-end gap-2">
                      <button
                        className={secondaryTextButtonClassName()}
                        disabled={editor.isUploadingImage}
                        onClick={clearPendingImageUpload}
                        type="button"
                      >
                        Cancel
                      </button>
                      <button
                        className={primaryTextButtonClassName()}
                        disabled={editor.isUploadingImage}
                        onClick={handleSavePendingImage}
                        type="button"
                      >
                        {editor.isUploadingImage ? "Saving…" : "Save"}
                      </button>
                    </div>
                  ) : null}

                  {audioUploadError ? (
                    <p className="text-sm text-muted-foreground">
                      {audioUploadError}
                    </p>
                  ) : null}

                  {imageUploadError ? (
                    <p className="text-sm text-muted-foreground">
                      {imageUploadError}
                    </p>
                  ) : null}
                </div>
              ) : (
                mediaPreview
              )}
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

      {isDeleteAudioConfirmOpen ? (
        <AdminConfirmDialog
          cancelLabel="Cancel"
          confirmLabel={editor.isDeletingAudio ? "Deleting…" : "Delete"}
          description="This audio file will be removed from storage. This cannot be undone."
          isConfirming={editor.isDeletingAudio}
          onClose={() => {
            if (!editor.isDeletingAudio) {
              setIsDeleteAudioConfirmOpen(false);
            }
          }}
          onConfirm={handleConfirmDeleteAudio}
          title="Delete audio?"
        />
      ) : null}

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
