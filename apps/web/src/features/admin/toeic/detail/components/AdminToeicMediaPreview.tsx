"use client";

import { iconOnlyButtonClassName } from "@/shared/ui/button";
import { DeleteIcon } from "@/shared/ui/icons/DeleteIcon";
import { statusColorClasses } from "@/shared/ui/theme/statusColors";

type AdminToeicMediaPreviewProps = {
  audioUrl: string | null;
  imageUrl: string | null;
  previewImageUrl?: string | null;
  questionNumber?: number;
  showAudio?: boolean;
  showImage?: boolean;
  showImagePlaceholder?: boolean;
  onRequestDeleteImage?: () => void;
};

export function AdminToeicMediaPreview({
  audioUrl,
  imageUrl,
  previewImageUrl = null,
  questionNumber,
  showAudio = true,
  showImage = true,
  showImagePlaceholder = false,
  onRequestDeleteImage,
}: AdminToeicMediaPreviewProps) {
  const displayImageUrl = previewImageUrl ?? imageUrl;
  const hasAudio = showAudio && audioUrl;
  const hasImage = showImage && displayImageUrl;
  const showMissingImage =
    showImage && showImagePlaceholder && !displayImageUrl;

  if (!hasAudio && !hasImage && !showMissingImage && !(showAudio && !audioUrl)) {
    return null;
  }

  return (
    <div className="flex shrink-0 flex-col gap-4 bg-background">
      {showAudio ? (
        audioUrl ? (
          <audio controls className="w-full" key={audioUrl} src={audioUrl} />
        ) : (
          <p className="text-base text-muted-foreground">No audio available.</p>
        )
      ) : null}
      {hasImage ? (
        <div className="relative">
          {onRequestDeleteImage && previewImageUrl == null ? (
            <button
              aria-label="Delete image"
              className={iconOnlyButtonClassName(
                "absolute top-2 right-2 z-10 border border-border bg-background/90",
                statusColorClasses.danger.text,
                statusColorClasses.danger.backgroundHover,
              )}
              onClick={onRequestDeleteImage}
              type="button"
            >
              <DeleteIcon />
            </button>
          ) : null}
          {/* eslint-disable-next-line @next/next/no-img-element -- signed Supabase URLs are dynamic */}
          <img
            alt={
              questionNumber != null
                ? `Question ${questionNumber}`
                : "Group visual"
            }
            className="mx-auto max-h-[420px] w-full rounded-lg object-contain"
            key={displayImageUrl}
            src={displayImageUrl}
          />
        </div>
      ) : null}
      {showMissingImage ? (
        <p className="text-base text-muted-foreground">No image available.</p>
      ) : null}
    </div>
  );
}
