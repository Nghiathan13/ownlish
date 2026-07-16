"use client";

import type { ReactNode } from "react";

type AdminToeicMediaPreviewProps = {
  audioUrl: string | null;
  imageUrl: string | null;
  previewAudioUrl?: string | null;
  previewImageUrl?: string | null;
  questionNumber?: number;
  showAudio?: boolean;
  showImage?: boolean;
  showImagePlaceholder?: boolean;
  beforeAudioSlot?: ReactNode;
  aboveAudioSlot?: ReactNode;
  afterAudioPlayerSlot?: ReactNode;
  afterAudioSlot?: ReactNode;
  beforeImageSlot?: ReactNode;
  afterImageSlot?: ReactNode;
};

export function AdminToeicMediaPreview({
  audioUrl,
  imageUrl,
  previewAudioUrl = null,
  previewImageUrl = null,
  questionNumber,
  showAudio = true,
  showImage = true,
  showImagePlaceholder = false,
  beforeAudioSlot,
  aboveAudioSlot,
  afterAudioPlayerSlot,
  afterAudioSlot,
  beforeImageSlot,
  afterImageSlot,
}: AdminToeicMediaPreviewProps) {
  const displayAudioUrl = previewAudioUrl ?? audioUrl;
  const displayImageUrl = previewImageUrl ?? imageUrl;
  const hasAudio = showAudio && displayAudioUrl;
  const hasImage = showImage && displayImageUrl;
  const showMissingImage =
    showImage && showImagePlaceholder && !displayImageUrl;

  if (
    !hasAudio &&
    !hasImage &&
    !showMissingImage &&
    !(showAudio && !displayAudioUrl) &&
    beforeAudioSlot == null &&
    aboveAudioSlot == null &&
    afterAudioPlayerSlot == null &&
    afterAudioSlot == null &&
    beforeImageSlot == null &&
    afterImageSlot == null
  ) {
    return null;
  }

  return (
    <div className="flex shrink-0 flex-col gap-4 bg-background">
      {showAudio ? (
        <>
          {beforeAudioSlot}
          {aboveAudioSlot}
          {displayAudioUrl ? (
            <audio
              controls
              className="w-full"
              key={displayAudioUrl}
              src={displayAudioUrl}
            />
          ) : (
            <p className="text-base text-muted-foreground">No audio available.</p>
          )}
          {afterAudioPlayerSlot}
        </>
      ) : null}
      {afterAudioSlot}
      {beforeImageSlot}
      {hasImage ? (
        // eslint-disable-next-line @next/next/no-img-element -- signed Supabase URLs are dynamic
        <img
          alt={
            questionNumber != null
              ? `Question ${questionNumber}`
              : "Group visual"
          }
          className="mx-auto max-h-[420px] w-full object-contain"
          key={displayImageUrl}
          src={displayImageUrl}
        />
      ) : null}
      {showMissingImage ? (
        <p className="text-base text-muted-foreground">No image available.</p>
      ) : null}
      {afterImageSlot}
    </div>
  );
}
