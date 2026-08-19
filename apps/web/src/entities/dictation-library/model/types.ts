export type DictationCatalogIndexCategory = {
  id: string;
  label: string;
  path: string;
};

export type DictationCatalogIndex = {
  version: 1;
  categories: DictationCatalogIndexCategory[];
};

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
