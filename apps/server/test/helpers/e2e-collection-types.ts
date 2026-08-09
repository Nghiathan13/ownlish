import type { VocabWordBody } from './e2e-vocab-types';

export type CollectionSummaryBody = {
  id: string;
  itemCount: number;
  isDefault?: boolean;
  kind: string;
  name: string;
};

export type CollectionCatalogBody = {
  catalogWords: VocabWordBody[];
};

export type CollectionCatalogPageBody = {
  items: VocabWordBody[];
  limit: number;
  offset: number;
  total: number;
};

export type CollectionImportBody = {
  imported: number;
  updated: number;
  skipped: number;
};
