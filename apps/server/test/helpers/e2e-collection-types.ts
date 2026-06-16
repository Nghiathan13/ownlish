import type { VocabWordBody } from './e2e-vocab-types';

export type CollectionSummaryBody = {
  id: string;
  itemCount: number;
  kind: string;
  name: string;
};

export type CollectionCatalogBody = {
  catalogWords: VocabWordBody[];
};

export type CollectionImportBody = {
  imported: number;
  updated: number;
  skipped: number;
};
