type AdminToeicMediaPreviewProps = {
  audioUrl: string | null;
  imageUrl: string | null;
};

export function AdminToeicMediaPreview({
  audioUrl,
  imageUrl,
}: AdminToeicMediaPreviewProps) {
  if (!audioUrl && !imageUrl) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3">
      {audioUrl ? (
        <audio controls className="w-full" key={audioUrl} src={audioUrl} />
      ) : null}
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          alt="Group visual"
          className="max-h-80 w-full rounded-lg border border-border object-contain"
          src={imageUrl}
        />
      ) : null}
    </div>
  );
}
