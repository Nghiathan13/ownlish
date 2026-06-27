type AdminToeicMediaPreviewProps = {
  audioUrl: string | null;
  imageUrl: string | null;
  questionNumber?: number;
  showAudio?: boolean;
  showImage?: boolean;
  showImagePlaceholder?: boolean;
};

export function AdminToeicMediaPreview({
  audioUrl,
  imageUrl,
  questionNumber,
  showAudio = true,
  showImage = true,
  showImagePlaceholder = false,
}: AdminToeicMediaPreviewProps) {
  const hasAudio = showAudio && audioUrl;
  const hasImage = showImage && imageUrl;
  const showMissingImage = showImage && showImagePlaceholder && !imageUrl;

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
        // eslint-disable-next-line @next/next/no-img-element -- signed Supabase URLs are dynamic
        <img
          alt={
            questionNumber != null
              ? `Question ${questionNumber}`
              : "Group visual"
          }
          className="mx-auto max-h-[420px] w-full rounded-lg object-contain"
          key={imageUrl}
          src={imageUrl}
        />
      ) : null}
      {showMissingImage ? (
        <p className="text-base text-muted-foreground">No image available.</p>
      ) : null}
    </div>
  );
}
