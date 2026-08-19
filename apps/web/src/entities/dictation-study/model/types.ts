export type DictationSegment = {
  endMs: number;
  id: string;
  startMs: number;
  text: string;
};

export type DictationVideo = {
  segments: DictationSegment[];
  status: "approved";
  timing: { granularity: "segment"; source: string };
  version: 1;
  video: {
    category: string;
    durationSeconds: number;
    language: string;
    title: string;
    url: string;
    youtubeVideoId: string;
  };
};

export type DictationProgress = {
  answeredSegmentIds: string[];
  completedAt: string | null;
  correctCount: number;
  updatedAt: string;
  videoId: string;
};
