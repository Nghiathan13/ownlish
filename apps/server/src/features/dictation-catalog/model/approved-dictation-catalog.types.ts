export type DictationCatalogVideo = {
  id: string;
  path: string;
  segmentCount: number;
};

export type DictationCatalogSegment = {
  id: string;
  text: string;
};

export type ApprovedDictationCatalogVideo = {
  id: string;
  segments: DictationCatalogSegment[];
};
