type Media = {
  audioUrl: string | null;
  imageUrl: string | null;
};

export function preloadMedia(media: Media | undefined) {
  if (!media || typeof window === "undefined") {
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
