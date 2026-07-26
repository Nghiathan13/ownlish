export type VocabDefinitionBody = {
  id: string;
  source?: string;
  type?: string;
  meaningVi?: string;
  level?: number;
  wrongCount?: number;
  deletedAt?: string | null;
  lastReview?: string | null;
  nextReview?: string | null;
  systemEntryId?: string | null;
  sourceWordId?: number;
  example?: string;
  band?: string;
};

export type VocabWordBody = {
  id: string;
  userId?: string;
  word: string;
  normalizedWord: string;
  definitions: VocabDefinitionBody[];
};

export type VocabListBody = {
  items: VocabWordBody[];
  meta: {
    limit: number;
    offset: number;
    total: number;
    hasMore: boolean;
  };
};

export type DeleteDefinitionBody = {
  deletedDefinitionId: string;
  vocabWordId: string;
  wordRemoved: boolean;
  word?: VocabWordBody;
};

export type VocabStatsBody = {
  total: number;
  due: number;
  mastered: number;
  highWrongCount: number;
  levels: Array<{ level: number; count: number }>;
};

export type ReviewDefinitionBody = {
  id: string;
  level?: number;
  wrongCount?: number;
  lastReview?: string | null;
  nextReview?: string | null;
  vocabWord?: VocabWordBody;
};

export type DueReviewListBody = {
  items: Array<{ id: string }>;
  meta: {
    limit: number;
    offset: number;
    total: number;
    hasMore: boolean;
  };
};
