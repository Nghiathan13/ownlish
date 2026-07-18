import type { ToeicQuestionGroup } from "@/entities/toeic/api/types";

type PartPracticeMedia = Pick<ToeicQuestionGroup, "audioUrl" | "imageUrl">;

export function preloadPartPracticeMedia(media: PartPracticeMedia | undefined) {
  if (!media) {
    return;
  }

  if (media.audioUrl) {
    const audio = new Audio();
    audio.preload = "auto";
    audio.src = media.audioUrl;
    audio.load();
  }

  if (media.imageUrl) {
    const image = new Image();
    image.src = media.imageUrl;
  }
}
