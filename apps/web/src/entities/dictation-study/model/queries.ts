export function getDictationVideoQueryKey(videoId: string | null) {
  return ["dictation", "video", videoId] as const;
}

export function getDictationProgressQueryKey(
  userId: string | null,
  videoId: string | null,
) {
  return ["dictation", "progress", userId, videoId] as const;
}
