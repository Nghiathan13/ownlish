export type ToeicCatalogMedia = {
  audio?: string;
  image?: string;
};

export type ToeicCatalogPart = {
  number: number;
  path: string;
  questionCount: number;
};

export type ToeicCatalogTest = {
  id: string;
  series: string;
  year: number;
  testNumber: number;
  complete: boolean;
  parts: ToeicCatalogPart[];
};

export type ToeicCatalogManifest = {
  schemaVersion: 1;
  tests: ToeicCatalogTest[];
  partPractice: ToeicCatalogPart[];
  mediaByGroupId: Record<string, ToeicCatalogMedia>;
};

export type ToeicCatalogDocument = {
  items?: unknown[];
  groups?: unknown[];
};

export type ToeicCatalogSource = {
  rootUrl: string;
  manifest: ToeicCatalogManifest;
};
