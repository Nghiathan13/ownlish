export type DictationCatalogVideo = {
  category: string;
  durationSeconds: number;
  id: string;
  language: string;
  path: string;
  segmentCount: number;
  title: string;
  youtubeVideoId: string;
};

export type DictationCatalog = {
  version: 1;
  videos: DictationCatalogVideo[];
};

export type DictationCatalogSource = {
  catalog: DictationCatalog;
  rootUrl: string;
};

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
  currentSegmentId: string | null;
  updatedAt: string;
  videoId: string;
};
